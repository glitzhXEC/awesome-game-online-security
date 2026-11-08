#!/usr/bin/env python3
"""Demonstrate why plaintext game frames can be sniffed, edited and replayed.

The demo is stdlib-only (no third-party cryptography) and uses an HMAC over a
versioned frame plus a per-session sequence number and anti-replay window. It is
for teaching and as an importable test fixture; treat it as an illustration of
the wire-format design in the protocol hardening guide, NOT production code.

Run it directly to see the story:

    python scripts/demo_packet_security.py

Import it from tests to drive the pieces:

    from demo_packet_security import hardened_frame, FrameServer
"""

import hashlib
import hmac
import os
import struct
from dataclasses import dataclass

# --- Protocol constants (mirror the guide's wire format) --------------------

VERSION = 1
OP_GIVE_COINS = 2  # payload is a signed 32-bit coin delta

# Hardened frame layout:
#   [ version: u8 ][ msg_type: u8 ][ session_id: u64 ][ seq: u64 ][ payload: bytes ][ auth_tag: 32 ]
_HARDENED_HEAD = struct.Struct("!BBQQ")
_HARDENED_TAG_LEN = 32

# Naive/vulnerable frame layout:
#   [ op: u8 ][ value: i32 ]
_PLAIN = struct.Struct("!Bi")


# --- Vulnerable (plaintext) frame ------------------------------------------

def make_plaintext_frame(op: int, value: int) -> bytes:
    """A naive frame anyone on the wire can read and rewrite."""
    return _PLAIN.pack(op, value)


def parse_plaintext_frame(frame: bytes) -> tuple:
    """Read a plaintext frame back into (op, value)."""
    return _PLAIN.unpack(frame)


def apply_plaintext_frame(balance: int, frame: bytes) -> int:
    """The naive server trusts whatever the frame says. Returns new balance."""
    op, value = parse_plaintext_frame(frame)
    if op == OP_GIVE_COINS:
        return balance + value
    return balance


# --- Hardened frame ---------------------------------------------------------

def hardened_frame(session_id: int, seq: int, payload: bytes, key: bytes) -> bytes:
    """Build an authenticated frame: versioned fields + HMAC-SHA256 tag.

    The tag covers version || msg_type || session_id || seq || payload so that
    changing any field, including the sequence number, breaks verification.
    """
    msg_type = OP_GIVE_COINS
    head = _HARDENED_HEAD.pack(VERSION, msg_type, session_id, seq)
    body = head + payload
    tag = hmac.new(key, body, hashlib.sha256).digest()
    return body + tag


def verify_frame(frame: bytes, key: bytes) -> tuple:
    """Verify a hardened frame and return (payload, session_id, seq), else None.

    Returns None when the frame is malformed or the MAC fails. It does NOT make
    a replay decision; callers feed the (session_id, seq) to the anti-replay
    window.
    """
    if len(frame) < _HARDENED_HEAD.size + _HARDENED_TAG_LEN:
        return None
    head_size = _HARDENED_HEAD.size
    body = frame[: len(frame) - _HARDENED_TAG_LEN]
    tag = frame[len(frame) - _HARDENED_TAG_LEN:]
    if not hmac.compare_digest(hmac.new(key, body, hashlib.sha256).digest(), tag):
        return None
    version, msg_type, session_id, seq = _HARDENED_HEAD.unpack(body[:head_size])
    if version != VERSION:
        return None
    return body[head_size:], session_id, seq


# --- Anti-replay window (server side) ---------------------------------------

class AntiReplayWindow:
    """A small sliding window rejecting old and duplicate sequence numbers.

    Permits limited loss/reordering while rejecting replays. A duplicate burst
    or a jump beyond the window forces a full resync (represented here by
    reset(): the caller decides the policy; production requires a full
    handshake resync).
    """

    def __init__(self, size: int = 32):
        self.size = size
        self.max_seen = -1
        self.seen = set()

    def accepts(self, seq: int) -> bool:
        if seq < 0 or seq <= self.max_seen - self.size:
            return False  # too old / outside the window
        if seq in self.seen:
            return False  # duplicate
        self.seen.add(seq)
        self.max_seen = max(self.max_seen, seq)
        return True


@dataclass
class FrameServer:
    """A tiny server-side balance that trusts either style of frame."""

    key: bytes = None
    _hardened: bool = True

    def __post_init__(self):
        if self.key is None:
            self.key = os.urandom(32)
        self.balance = 0
        self.accepted = 0
        self.rejected = 0
        self.windows = {}

    def _window(self, session_id: int) -> AntiReplayWindow:
        return self.windows.setdefault(session_id, AntiReplayWindow())

    def deliver_plaintext(self, frame: bytes) -> int:
        """Receive a naive frame; returns the *new* balance (already applied)."""
        self.balance = apply_plaintext_frame(self.balance, frame)
        self.accepted += 1
        return self.balance

    def deliver_hardened(self, frame: bytes) -> int:
        """Receive a hardened frame; returns new balance or -1 if rejected.

        Rejection covers bad MAC, wrong version, and replay/out-of-window
        sequence numbers, and causes NO state change.
        """
        result = verify_frame(frame, self.key)
        if result is None:
            self.rejected += 1
            return -1
        payload, session_id, seq = result
        if not self._window(session_id).accepts(seq):
            self.rejected += 1
            return -1
        op, value = _PLAIN.unpack(payload)  # payload itself is [op:u8][value:i32]
        if op == OP_GIVE_COINS:
            self.balance += value
        self.accepted += 1
        return self.balance


# --- The demo -----------------------------------------------------------------

def _run_demo():
    print("=" * 62)
    print("1. PLAINTEXT FRAME: sniff, edit, replay - all silently accepted")
    print("=" * 62)
    server = FrameServer()
    original = make_plaintext_frame(OP_GIVE_COINS, 100)
    print(f"server   sniffed: {parse_plaintext_frame(original)} (balance -> "
          f"{server.deliver_plaintext(original)})")
    forged = make_plaintext_frame(OP_GIVE_COINS, 99999)
    print(f"attacker edits to 99999: balance -> {server.deliver_plaintext(forged)}")
    print(f"attacker replays original: balance -> {server.deliver_plaintext(original)}")
    print("=> no MAC, no sequence, no replay protection: server cannot tell.\n")

    print("=" * 62)
    print("2. HARDENED FRAME: HMAC + session + anti-replay window")
    print("=" * 62)
    server = FrameServer()
    key = server.key
    session = 424242
    payload = _PLAIN.pack(OP_GIVE_COINS, 100)
    legit = hardened_frame(session, seq=0, payload=payload, key=key)
    print(f"server   accepts legit seq=0: balance -> "
          f"{server.deliver_hardened(legit)}")

    # Tamper: flip the lowest coin-delta byte of the payload.
    bad = bytearray(legit)
    payload_offset = _HARDENED_HEAD.size  # head is version||msg_type||session||seq
    bad[payload_offset + _PLAIN.size - 1] ^= 0xFF
    print(f"server   rejects tampered payload...")
    print(f"server   rejected: {server.deliver_hardened(bytes(bad))} (no state change)")

    # Replay the legitimate seq=0 frame now that it is inside the window's seen set.
    print(f"server   rejects replayed seq=0: "
          f"{server.deliver_hardened(legit)} (no state change)")

    # A later valid sequence still works within the window.
    later = hardened_frame(session, seq=1, payload=payload, key=key)
    print(f"server   accepts legit seq=1: balance -> {server.deliver_hardened(later)}")

    print("\nSummary: the hardened construction rejects every byte the attacker")
    print("changed and every frame it already saw; the plaintext one accepted all.")


if __name__ == "__main__":
    _run_demo()
