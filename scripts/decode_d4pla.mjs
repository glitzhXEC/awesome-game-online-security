import fs from "node:fs";

const txt = fs.readFileSync(
  "C:/Users/glitz/.local/share/opencode/shell/2971a15c6658163e9dc4cf360998957a02d8df31/sh_1bbe4b0ea001eTDaF2Sj8z4aia.out",
  "utf8"
);

const re = /"D4PLA([A-Za-z0-9+/=]+)"/g;
let m;
let seen = new Set();
let n = 0;
while ((m = re.exec(txt)) && n < 400) {
  const b = Buffer.from("D4PLA" + m[1], "base64");
  let printable = "";
  for (const x of b) {
    printable += x > 31 && x < 127 ? String.fromCharCode(x) : ".";
  }
  const key = printable.replace(/\s+/g, " ").slice(0, 40);
  if (!seen.has(key)) {
    seen.add(key);
    n++;
    console.log(`[${b.length}B] ${printable}`);
  }
}
