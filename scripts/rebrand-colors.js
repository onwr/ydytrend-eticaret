const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "..")
const reps = [
  ["#4f6f52", "#38BDF8"],
  ["#4F6F52", "#38BDF8"],
  ["#6f8f73", "#0EA5E9"],
  ["#6F8F73", "#0EA5E9"],
  ["#3d5a3f", "#0284C7"],
  ["#5f7f64", "#0EA5E9"],
  ["#7a9c7e", "#94A3B8"],
  ["#8cae90", "#94A3B8"],
  ["#bcd2bf", "#E2E8F0"],
  ["#d4e0d5", "#E2E8F0"],
  ["#dce6dd", "#E2E8F0"],
  ["#dceadd", "#64748B"],
  ["#e0e8e1", "#E2E8F0"],
  ["#f4f8f4", "#F8FAFC"],
  ["#f4f7f4", "#F8FAFC"],
  ["#f7faf7", "#F8FAFC"],
  ["#eef4ef", "#F8FAFC"],
  ["#e1ede3", "#F8FAFC"],
  ["rgba(122,156,126,0.12)", "rgba(56,189,248,0.12)"],
  ["rgba(61,92,66,0.12)", "rgba(14,165,233,0.12)"],
  ["Little Mom's Store", "Mobil Tedarik"],
  ["Little Mom's", "Mobil Tedarik"],
  ["Little Mom Store", "Mobil Tedarik"],
  ["Tekno Market", "Mobil Tedarik"],
]

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if ([".next", "node_modules", "generated"].includes(ent.name)) continue
      walk(p)
    } else if (/\.(tsx?|css)$/.test(ent.name)) {
      let c = fs.readFileSync(p, "utf8")
      const o = c
      for (const [a, b] of reps) c = c.split(a).join(b)
      if (c !== o) fs.writeFileSync(p, c, "utf8")
    }
  }
}

walk(root)
console.log("rebrand-colors done")
