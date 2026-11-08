import importlib.util, struct, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from demo_packet_security import (  # noqa: E402
    OP_GIVE_COINS, VERSION, _HARDENED_HEAD, _HARDENED_TAG_LEN, _PLAIN,
    AntiReplayWindow, FrameServer,
    apply_plaintext_frame, hardened_frame, make_plaintext_frame,
    parse_plaintext_frame, verify_frame,
)

PAYLOAD = _PLAIN.pack(OP_GIVE_COINS, 100)


class PlaintextTests(unittest.TestCase):
    def test_roundtrip(self):
        frame = make_plaintext_frame(OP_GIVE_COINS, 100)
        self.assertEqual(len(frame), _PLAIN.size)
        self.assertEqual(parse_plaintext_frame(frame), (OP_GIVE_COINS, 100))

    def test_apply_trusts_anything(self):
        self.assertEqual(apply_plaintext_frame(0, make_plaintext_frame(OP_GIVE_COINS, 50)), 50)
        self.assertEqual(apply_plaintext_frame(50, make_plaintext_frame(OP_GIVE_COINS, -30)), 20)
        # Unknown op is ignored but never rejected.
        self.assertEqual(apply_plaintext_frame(10, make_plaintext_frame(9, 999)), 10)


class HardenedFrameTests(unittest.TestCase):
    def setUp(self):
        self.key = b'k' * 32

    def test_verify_roundtrip(self):
        frame = hardened_frame(4242, 7, PAYLOAD, self.key)
        payload, session_id, seq = verify_frame(frame, self.key)
        self.assertEqual(payload, PAYLOAD)
        self.assertEqual(session_id, 4242)
        self.assertEqual(seq, 7)

    def test_wrong_key_fails(self):
        frame = hardened_frame(1, 1, PAYLOAD, self.key)
        self.assertIsNone(verify_frame(frame, b'x' * 32))

    def test_truncated_fails(self):
        frame = hardened_frame(1, 1, PAYLOAD, self.key)
        self.assertIsNone(verify_frame(frame[:-1], self.key))
        self.assertIsNone(verify_frame(b'', self.key))

    def test_tamper_any_field_fails(self):
        frame = hardened_frame(1, 1, PAYLOAD, self.key)
        bad = bytearray(frame)
        # Flip the seq field in the head.
        bad[_HARDENED_HEAD.size - 1] ^= 0xFF
        self.assertIsNone(verify_frame(bytes(bad), self.key))
        # Flip a payload byte.
        bad2 = bytearray(frame)
        bad2[_HARDENED_HEAD.size + _PLAIN.size - 1] ^= 0xFF
        self.assertIsNone(verify_frame(bytes(bad2), self.key))
        # Flip a tag byte.
        bad3 = bytearray(frame)
        bad3[-1] ^= 0xFF
        self.assertIsNone(verify_frame(bytes(bad3), self.key))

    def test_wrong_version_fails(self):
        @staticmethod
        def make_bad_version():
            head = struct.pack('!BBQQ', VERSION + 1, OP_GIVE_COINS, 1, 1)
            body = head + PAYLOAD
            import hmac, hashlib
            tag = hmac.new(b'k' * 32, body, hashlib.sha256).digest()
            return body + tag

        for frame in (make_bad_version(),):
            self.assertIsNone(verify_frame(frame, b'k' * 32))

    def test_no_tag_no_trust(self):
        frame = hardened_frame(1, 1, PAYLOAD, self.key)
        self.assertIsNone(verify_frame(frame[: _HARDENED_HEAD.size + len(PAYLOAD)], self.key))


class AntiReplayWindowTests(unittest.TestCase):
    def test_first_accepts(self):
        w = AntiReplayWindow()
        self.assertTrue(w.accepts(0))
        self.assertTrue(w.accepts(1))

    def test_duplicate_rejected_forever(self):
        w = AntiReplayWindow()
        self.assertTrue(w.accepts(5))
        self.assertFalse(w.accepts(5))

    def test_old_out_of_window_rejected(self):
        w = AntiReplayWindow(size=4)
        for seq in (10, 11, 12, 13, 14):
            self.assertTrue(w.accepts(seq))
        # 9 is older than max_seen(14) - size(4) == 10, so it is outside the window.
        self.assertFalse(w.accepts(9))

    def test_reorder_and_loss_inside_window(self):
        w = AntiReplayWindow(size=32)
        self.assertTrue(w.accepts(10))
        self.assertTrue(w.accepts(9))  # small reorder still within window
        self.assertFalse(w.accepts(10))  # but a true replay still rejected
        self.assertTrue(w.accepts(20))  # a lost 11..19 does not break the stream


class FrameServerTests(unittest.TestCase):
    def setUp(self):
        self.server = FrameServer()

    def test_plaintext_does_not_reject(self):
        frame = make_plaintext_frame(OP_GIVE_COINS, 100)
        self.assertEqual(self.server.deliver_plaintext(frame), 100)
        self.assertEqual(self.server.deliver_plaintext(frame), 200)  # replay also accepted
        self.assertEqual(self.server.accepted, 2)
        self.assertEqual(self.server.rejected, 0)

    def test_hardened_legit_flow(self):
        frame = hardened_frame(1, 0, PAYLOAD, self.server.key)
        self.assertEqual(self.server.deliver_hardened(frame), 100)
        self.assertEqual(self.server.accepted, 1)
        self.assertEqual(self.server.rejected, 0)

    def test_hardened_replay_and_tamper_reject_without_state_change(self):
        frame = hardened_frame(1, 0, PAYLOAD, self.server.key)
        self.assertEqual(self.server.deliver_hardened(frame), 100)
        balance_before = self.server.balance
        accepted_before = self.server.accepted
        self.assertEqual(self.server.deliver_hardened(frame), -1)  # replay
        self.assertEqual(self.server.balance, balance_before)
        self.assertEqual(self.server.accepted, accepted_before)
        self.assertEqual(self.server.rejected, 1)

        bad = bytearray(frame)
        bad[_HARDENED_HEAD.size + _PLAIN.size - 1] ^= 0xFF
        self.assertEqual(self.server.deliver_hardened(bytes(bad)), -1)  # tamper
        self.assertEqual(self.server.balance, balance_before)
        self.assertEqual(self.server.accepted, accepted_before)
        self.assertEqual(self.server.rejected, 2)

        # Truncation rejected too.
        self.assertEqual(self.server.deliver_hardened(frame[:-1]), -1)
        self.assertEqual(self.server.rejected, 3)

    def test_hardened_out_of_window_rejected(self):
        # Advance the window past the default 32 slots, skipping seq=8 entirely
        # so that seq=8 has never been seen. It must still be rejected because it
        # is older than max_seen(40) - size(32) == 8 (out of window), not just
        # because it is a duplicate.
        for seq in list(range(0, 8)) + list(range(9, 41)):
            hardened = hardened_frame(1, seq, PAYLOAD, self.server.key)
            self.assertNotEqual(self.server.deliver_hardened(hardened), -1)
        self.assertEqual(self.server.balance, 4000)
        accepted_before = self.server.accepted
        stale = hardened_frame(1, 8, PAYLOAD, self.server.key)
        self.assertEqual(self.server.deliver_hardened(stale), -1)
        self.assertEqual(self.server.accepted, accepted_before)
        self.assertEqual(self.server.rejected, 1)

    def test_hardened_reorder_and_loss_accepted(self):
        frame0 = hardened_frame(7, 0, PAYLOAD, self.server.key)
        frame1 = hardened_frame(7, 1, PAYLOAD, self.server.key)
        frame2 = hardened_frame(7, 2, PAYLOAD, self.server.key)
        self.assertEqual(self.server.deliver_hardened(frame2), 100)  # loss of 0,1 is fine
        self.assertEqual(self.server.deliver_hardened(frame0), 200)  # small reorder ok
        self.assertEqual(self.server.deliver_hardened(frame1), 300)
        self.assertEqual(self.server.accepted, 3)
        self.assertEqual(self.server.rejected, 0)

    def test_sessions_isolated(self):
        a1 = hardened_frame(1, 5, PAYLOAD, self.server.key)
        a2 = hardened_frame(1, 5, PAYLOAD, self.server.key)
        b = hardened_frame(2, 5, PAYLOAD, self.server.key)
        self.assertEqual(self.server.deliver_hardened(a1), 100)
        self.assertEqual(self.server.deliver_hardened(b), 200)  # different session, same seq ok
        self.assertEqual(self.server.deliver_hardened(a2), -1)  # same session replay rejected
        self.assertEqual(self.server.accepted, 2)
        self.assertEqual(self.server.rejected, 1)


if __name__ == '__main__':
    unittest.main()
