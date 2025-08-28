// scripts/find-duplicates.mjs
import { readdir, stat, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(process.cwd(), "src");
const OUTDIR = path.resolve(process.cwd(), "audit");
const OUTCSV = path.join(OUTDIR, "duplicates.csv");
const EXCLUDE_DIRS = new Set(["node_modules", "dist", ".git", ".idea", ".next"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".svg"]);

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.has(e.name)) await walk(p, acc);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (EXTS.has(ext)) acc.push(p);
    }
  }
  return acc;
}

async function sha256(file) {
  const buf = await readFile(file);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    const list = m.get(k);
    if (list) list.push(item);
    else m.set(k, [item]);
  }
  return m;
}

(async () => {
  const files = await walk(ROOT);
  const records = [];
  const byHash = new Map();

  for (const f of files) {
    const hash = await sha256(f);
    const list = byHash.get(hash);
    if (list) list.push(f);
    else byHash.set(hash, [f]);
  }

  let dupes = 0;
  console.log("=== Exact duplicates (by content hash) ===");
  for (const [hash, group] of byHash.entries()) {
    if (group.length > 1) {
      dupes++;
      console.log(`\nhash ${hash.slice(0, 12)} …`);
      for (const g of group) {
        console.log("  -", path.relative(process.cwd(), g));
        records.push({ hash, file: path.relative(process.cwd(), g) });
      }
    }
  }
  if (dupes === 0) console.log("None 🎉");

  // Potential duplicates: same basename, different dirs
  const byName = groupBy(files, (f) => path.basename(f).toLowerCase());
  console.log("\n=== Potential duplicates (same filename) ===");
  let potentials = 0;
  for (const [name, group] of byName.entries()) {
    if (group.length > 1) {
      potentials++;
      console.log(`\n${name}`);
      group.forEach((g) => console.log("  -", path.relative(process.cwd(), g)));
    }
  }
  if (potentials === 0) console.log("None 🎉");

  await mkdir(OUTDIR, { recursive: true });
  const csv =
    "hash,file\n" +
    records.map((r) => `${r.hash},${r.file.replaceAll(",", "\\,")}`).join("\n");
  await writeFile(OUTCSV, csv);
  console.log(`\nSaved CSV: ${path.relative(process.cwd(), OUTCSV)}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
