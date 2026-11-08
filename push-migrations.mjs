// Sends supabase/migrations to your SuloBase project's "migrate" function.
// Needs SUPABASE_URL and SUPABASE_SECRET_KEY. Node 18+, no dependencies.
import { readdir, readFile } from "node:fs/promises";

const dir = "supabase/migrations";
const fn = process.env.MIGRATE_FUNCTION || "migrate";
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SECRET_KEY");
  process.exit(2);
}

const names = (await readdir(dir))
  .filter((n) => /^\d{14}(_[A-Za-z0-9_-]+)?\.sql$/.test(n))
  .sort();
const migrations = await Promise.all(
  names.map(async (name) => ({ name, sql: await readFile(dir + "/" + name, "utf8") })),
);

const res = await fetch(url.replace(/\/+$/, "") + "/functions/v1/" + fn, {
  method: "POST",
  headers: { "content-type": "application/json", apikey: key, authorization: "Bearer " + key },
  body: JSON.stringify({ migrations, dryRun: process.argv.includes("--dry-run") }),
});
console.log(JSON.stringify(await res.json(), null, 2));
process.exit(res.ok ? 0 : 1);
