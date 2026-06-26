/**
 * Production verification — Node.js only (no PowerShell try/catch).
 * Reports MISSING items only. Exit 0 if nothing missing, 1 otherwise.
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD='...' node scripts/verify-production.mjs
 *
 * Reads Supabase URL + publishable key from .env.local (falls back to .env).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// ── env loader ──────────────────────────────────────────────────────────────
function loadEnvFile(filename) {
  const filePath = path.join(root, filename);
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };

const ref = env.VITE_SUPABASE_PROJECT_ID || "xbignrigchholsrbnvhl";
const supabaseUrl = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/$/, "");
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || "";
const dbPassword = env.SUPABASE_DB_PASSWORD;

const missing = {
  migrations: [],
  tables: [],
  rpcFunctions: [],
  rlsDisabledOn: [],
  storageBuckets: [],
  realtimeTables: [],
  authTriggers: [],
  edgeFunctions: [],
  apiChecks: [],
  localhost: null,
};

const EXPECTED_TABLES = [
  "audit_logs", "categories", "conversations", "messages", "notifications",
  "order_items", "orders", "payments", "payouts", "product_messages",
  "product_views", "products", "profiles", "reports", "reviews", "rides",
  "saved_searches", "search_alerts", "search_events", "user_roles", "wishlist",
];
const EXPECTED_RPC = ["rank_products", "search_products", "has_role", "handle_new_user"];
const EXPECTED_BUCKETS = ["product-images", "avatars"];
const EXPECTED_REALTIME = ["messages", "products", "rides", "notifications"];
const EDGE_FUNCTIONS = ["ai-assistant", "expire-listings", "saved-search-runner"];
const LOCAL_PORTS = [8083, 8082, 8081, 8080, 8084, 5173];

// ── migrations on disk vs DB ────────────────────────────────────────────────
const migrationsDir = path.join(root, "supabase", "migrations");
const diskVersions = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => f.split("_")[0])
  .sort();

if (!dbPassword) {
  missing.apiChecks.push("SUPABASE_DB_PASSWORD not set — cannot verify database");
} else {
  const dbUrl = `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`;
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  let connected = false;
  await client.connect().then(() => { connected = true; }).catch((e) => {
    missing.apiChecks.push(`database connection failed: ${e.message}`);
  });

  if (connected) {
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const tableSet = new Set(tables.rows.map((r) => r.table_name));
    missing.tables = EXPECTED_TABLES.filter((t) => !tableSet.has(t));

    const fns = await client.query(
      `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'`,
    );
    const fnSet = new Set(fns.rows.map((r) => r.routine_name));
    missing.rpcFunctions = EXPECTED_RPC.filter((f) => !fnSet.has(f));

    const rls = await client.query(
      `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`,
    );
    missing.rlsDisabledOn = rls.rows
      .filter((r) => EXPECTED_TABLES.includes(r.tablename) && !r.rowsecurity)
      .map((r) => r.tablename);

    const buckets = await client.query(`SELECT id FROM storage.buckets`);
    const bucketSet = new Set(buckets.rows.map((r) => r.id));
    missing.storageBuckets = EXPECTED_BUCKETS.filter((b) => !bucketSet.has(b));

    const realtime = await client.query(
      `SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'`,
    );
    const rtSet = new Set(realtime.rows.map((r) => r.tablename));
    missing.realtimeTables = EXPECTED_REALTIME.filter((t) => !rtSet.has(t));

    const applied = await client.query(
      `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version`,
    );
    const appliedSet = new Set(applied.rows.map((r) => r.version));
    missing.migrations = diskVersions.filter((v) => !appliedSet.has(v));

    const authTrigger = await client.query(
      `SELECT tgname FROM pg_trigger t
       JOIN pg_class c ON c.oid = t.tgrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'auth' AND c.relname = 'users' AND tgname = 'on_auth_user_created'`,
    );
    if (authTrigger.rows.length === 0) {
      missing.authTriggers.push("on_auth_user_created on auth.users");
    }

    await client.end();
  }
}

// ── Supabase REST / Auth (publishable key) ──────────────────────────────────
if (!supabaseUrl) {
  missing.apiChecks.push("VITE_SUPABASE_URL missing from .env.local");
}
if (!publishableKey || publishableKey.includes("PASTE_")) {
  missing.apiChecks.push("VITE_SUPABASE_PUBLISHABLE_KEY missing or placeholder");
} else if (supabaseUrl) {
  const headers = { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` };

  const restChecks = [
    ["categories", `${supabaseUrl}/rest/v1/categories?select=id&limit=1`],
    ["products", `${supabaseUrl}/rest/v1/products?select=id&limit=1`],
    ["rank_products rpc", `${supabaseUrl}/rest/v1/rpc/rank_products`, "POST", { search_query: "", result_limit: 1 }],
  ];

  for (const [name, url, method = "GET", body] of restChecks) {
    const res = await fetch(url, {
      method,
      headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    }).catch((e) => ({ ok: false, status: 0, statusText: e.message }));

    if (!res.ok) {
      missing.apiChecks.push(`${name}: HTTP ${res.status || "?"} ${res.statusText || ""}`.trim());
    }
  }

  const authRes = await fetch(`${supabaseUrl}/auth/v1/health`, { headers }).catch((e) => ({
    ok: false,
    status: 0,
    statusText: e.message,
  }));
  if (!authRes.ok) {
    missing.apiChecks.push(`auth health: HTTP ${authRes.status || "?"} ${authRes.statusText || ""}`.trim());
  }
}

// ── Edge Functions ──────────────────────────────────────────────────────────
if (supabaseUrl && publishableKey && !publishableKey.includes("PASTE_")) {
  for (const fn of EDGE_FUNCTIONS) {
    const res = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
      method: "OPTIONS",
      headers: { apikey: publishableKey },
    }).catch((e) => ({ status: 0, statusText: e.message }));

    // Deployed functions respond 200/204/405; undeployed typically 404
    if (res.status === 404) {
      missing.edgeFunctions.push(fn);
    }
  }
}

// ── Local dev server ────────────────────────────────────────────────────────
let localOk = false;
for (const port of LOCAL_PORTS) {
  const res = await fetch(`http://localhost:${port}/`, {
    signal: AbortSignal.timeout(3000),
  }).catch(() => null);

  if (res && res.ok) {
    const html = await res.text();
    if (html.includes("Shpalljet") || html.includes("id=\"root\"")) {
      localOk = true;
      missing.localhost = null;
      break;
    }
  }
}
if (!localOk) {
  missing.localhost = `no dev server on ports ${LOCAL_PORTS.join(", ")}`;
}

// ── output: missing only ────────────────────────────────────────────────────
const hasMissing = Object.entries(missing).some(([, v]) => {
  if (v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(v);
});

const output = {};
for (const [key, val] of Object.entries(missing)) {
  if (val === null) continue;
  if (Array.isArray(val) && val.length === 0) continue;
  if (typeof val === "string" && !val) continue;
  output[key] = val;
}

if (Object.keys(output).length === 0) {
  console.log(JSON.stringify({ ok: true }, null, 2));
  process.exit(0);
} else {
  console.log(JSON.stringify({ ok: false, missing: output }, null, 2));
  process.exit(1);
}
