import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const DB_PATH = process.env["CRM_DB_PATH"] ?? path.join(process.cwd(), "data", "akili.db");

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS staff_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lab_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_name TEXT NOT NULL DEFAULT 'AKILI LABS',
  tagline TEXT NOT NULL DEFAULT 'Clinical Testing & Lab Supply',
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  hours TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'ZMW',
  vat_rate REAL NOT NULL DEFAULT 16,
  invoice_footer TEXT NOT NULL DEFAULT '',
  report_footer TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by INTEGER REFERENCES staff_users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  national_id TEXT,
  lab_mrn TEXT,
  date_of_birth TEXT,
  sex TEXT,
  address TEXT,
  next_of_kin TEXT,
  next_of_kin_phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_by INTEGER REFERENCES staff_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_at TEXT NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by INTEGER REFERENCES staff_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clinical_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sample_type TEXT NOT NULL,
  turnaround TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  price_cash_zmw REAL NOT NULL DEFAULT 0,
  price_vat_zmw REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  published INTEGER NOT NULL DEFAULT 1,
  result_unit TEXT NOT NULL DEFAULT '',
  reference_range TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lab_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  accession_number TEXT,
  ordered_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'ordered',
  notes TEXT,
  ordered_by INTEGER REFERENCES staff_users(id),
  results_entered_by INTEGER REFERENCES staff_users(id),
  validated_by INTEGER REFERENCES staff_users(id),
  validated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS specimens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  specimen_type TEXT NOT NULL DEFAULT '',
  collected_at TEXT,
  received_at TEXT,
  condition TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejected_reason TEXT,
  barcode TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lab_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES clinical_tests(id),
  result_value TEXT,
  result_unit TEXT,
  result_flag TEXT,
  reported_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER REFERENCES staff_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  meta TEXT
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'quote',
  status TEXT NOT NULL DEFAULT 'new',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  org_name TEXT,
  interest TEXT,
  preferred_date TEXT,
  address TEXT,
  notes TEXT,
  client_id INTEGER REFERENCES clients(id),
  assigned_to INTEGER REFERENCES staff_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS equipment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES leads(id),
  ordered_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'quoted',
  notes TEXT,
  ordered_by INTEGER REFERENCES staff_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS equipment_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES equipment_orders(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  issued_at TEXT,
  due_at TEXT,
  notes TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES staff_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_equipment_orders_status ON equipment_orders(status);
CREATE INDEX IF NOT EXISTS idx_equipment_orders_client ON equipment_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
`;

function ensureClinicalTestColumns(sqlite: Database.Database) {
  const cols = sqlite.prepare("PRAGMA table_info(clinical_tests)").all() as Array<{ name: string }>;
  if (cols.length === 0) return;
  const names = new Set(cols.map((col) => col.name));
  const alters: string[] = [];
  if (!names.has("price_cash_zmw")) {
    alters.push("ALTER TABLE clinical_tests ADD COLUMN price_cash_zmw REAL NOT NULL DEFAULT 0");
  }
  if (!names.has("price_vat_zmw")) {
    alters.push("ALTER TABLE clinical_tests ADD COLUMN price_vat_zmw REAL NOT NULL DEFAULT 0");
  }
  if (!names.has("published")) {
    alters.push("ALTER TABLE clinical_tests ADD COLUMN published INTEGER NOT NULL DEFAULT 1");
  }
  if (!names.has("result_unit")) {
    alters.push("ALTER TABLE clinical_tests ADD COLUMN result_unit TEXT NOT NULL DEFAULT ''");
  }
  if (!names.has("reference_range")) {
    alters.push("ALTER TABLE clinical_tests ADD COLUMN reference_range TEXT NOT NULL DEFAULT ''");
  }
  if (!names.has("updated_at")) {
    alters.push("ALTER TABLE clinical_tests ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''");
  }
  for (const statement of alters) {
    sqlite.exec(statement);
  }
  if (alters.some((s) => s.includes("updated_at"))) {
    sqlite.exec(
      "UPDATE clinical_tests SET updated_at = datetime('now') WHERE updated_at IS NULL OR updated_at = ''",
    );
  }
}

function ensureInvoiceColumns(sqlite: Database.Database) {
  const cols = sqlite.prepare("PRAGMA table_info(invoices)").all() as Array<{ name: string }>;
  if (cols.length === 0) return;
  const names = new Set(cols.map((col) => col.name));
  if (!names.has("tax")) {
    sqlite.exec("ALTER TABLE invoices ADD COLUMN tax REAL NOT NULL DEFAULT 0");
  }
}

function ensureLabOrderColumns(sqlite: Database.Database) {
  const cols = sqlite.prepare("PRAGMA table_info(lab_orders)").all() as Array<{ name: string }>;
  if (cols.length === 0) return;
  const names = new Set(cols.map((col) => col.name));
  const orderAlters: Array<[string, string]> = [
    ["accession_number", "TEXT"],
    ["results_entered_by", "INTEGER REFERENCES staff_users(id)"],
    ["validated_by", "INTEGER REFERENCES staff_users(id)"],
    ["validated_at", "TEXT"],
    ["patient_number", "TEXT"],
    ["age", "TEXT"],
    ["sex", "TEXT"],
    ["ward", "TEXT"],
    ["specimen_type", "TEXT"],
    ["specimen_sites", "TEXT"],
    ["requesting_doctor", "TEXT"],
    ["received_from", "TEXT"],
    ["brought_by", "TEXT"],
    ["received_by_name", "TEXT"],
    ["sponsor", "TEXT"],
    ["date_collected", "TEXT"],
    ["contact_number", "TEXT"],
    ["section", "TEXT"],
    ["reporting_time", "TEXT"],
  ];
  for (const [name, type] of orderAlters) {
    if (!names.has(name)) {
      sqlite.exec(`ALTER TABLE lab_orders ADD COLUMN ${name} ${type}`);
    }
  }

  // Backfill accession numbers for legacy rows.
  const missingAcc = sqlite
    .prepare(
      "SELECT id, ordered_at FROM lab_orders WHERE accession_number IS NULL OR trim(accession_number) = ''",
    )
    .all() as Array<{ id: number; ordered_at: string }>;
  const updateAcc = sqlite.prepare("UPDATE lab_orders SET accession_number = ? WHERE id = ?");
  for (const row of missingAcc) {
    const year = (row.ordered_at || "").slice(0, 4) || String(new Date().getFullYear());
    updateAcc.run(`ACC-${year}-${String(row.id).padStart(5, "0")}`, row.id);
  }

  try {
    sqlite.exec("CREATE INDEX IF NOT EXISTS idx_lab_orders_accession ON lab_orders(accession_number)");
    sqlite.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_lab_orders_accession_unique ON lab_orders(accession_number) WHERE accession_number IS NOT NULL AND accession_number != ''",
    );
  } catch {
    // Partial unique index optional on older SQLite.
  }

  const itemCols = sqlite.prepare("PRAGMA table_info(lab_order_items)").all() as Array<{
    name: string;
  }>;
  if (itemCols.length === 0) return;
  const itemNames = new Set(itemCols.map((col) => col.name));
  for (const name of ["urinalysis", "microscopy", "culture", "sensitivity"]) {
    if (!itemNames.has(name)) {
      sqlite.exec(`ALTER TABLE lab_order_items ADD COLUMN ${name} TEXT`);
    }
  }
}

function ensureSpecimensTable(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS specimens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
      specimen_type TEXT NOT NULL DEFAULT '',
      collected_at TEXT,
      received_at TEXT,
      condition TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      rejected_reason TEXT,
      barcode TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_specimens_order ON specimens(order_id);
  `);

  // Backfill one pending/received specimen per order that has none.
  const ordersMissing = sqlite
    .prepare(
      `SELECT o.id, o.specimen_type, o.date_collected, o.status
       FROM lab_orders o
       WHERE NOT EXISTS (SELECT 1 FROM specimens s WHERE s.order_id = o.id)`,
    )
    .all() as Array<{
    id: number;
    specimen_type: string | null;
    date_collected: string | null;
    status: string;
  }>;
  const insert = sqlite.prepare(
    `INSERT INTO specimens (order_id, specimen_type, collected_at, received_at, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  );
  for (const row of ordersMissing) {
    const specimenStatus =
      row.status === "rejected"
        ? "rejected"
        : row.status === "ordered"
          ? "pending"
          : "received";
    const receivedAt =
      specimenStatus === "received" || specimenStatus === "rejected"
        ? new Date().toISOString()
        : null;
    insert.run(
      row.id,
      row.specimen_type || "Unspecified",
      row.date_collected || null,
      receivedAt,
      specimenStatus,
    );
  }
}

function ensureLabSettingsRow(sqlite: Database.Database) {
  const row = sqlite.prepare("SELECT id, whatsapp FROM lab_settings WHERE id = 1").get() as
    | { id: number; whatsapp: string }
    | undefined;
  if (!row) {
    sqlite
      .prepare(
        `INSERT INTO lab_settings (
        id, org_name, tagline, phone, whatsapp, email, address, hours,
        currency, vat_rate, invoice_footer, report_footer, updated_at
      ) VALUES (
        1,
        'AKILI LABS',
        'Clinical Testing & Lab Supply',
        '+260 211 000 000',
        '260974617682',
        'kangpethias@gmail.com',
        'Lusaka, Zambia',
        'Mon-Fri 08:00-18:00  |  Sat 09:00-13:00',
        'ZMW',
        16,
        'Thank you for choosing AKILI LABS. Payment is due within 14 days unless otherwise agreed.',
        'This laboratory report is confidential and intended for the requesting clinician or patient.',
        datetime('now')
      )`,
      )
      .run();
    return;
  }
  if (row.whatsapp === "260977000000" || !String(row.whatsapp ?? "").trim()) {
    sqlite
      .prepare(
        `UPDATE lab_settings SET whatsapp = '260974617682', updated_at = datetime('now') WHERE id = 1`,
      )
      .run();
  }
  const emailRow = sqlite.prepare("SELECT email FROM lab_settings WHERE id = 1").get() as
    | { email: string }
    | undefined;
  if (
    !emailRow?.email?.trim() ||
    emailRow.email === "sales@akililabs.example" ||
    emailRow.email.endsWith("@akililabs.example")
  ) {
    sqlite
      .prepare(
        `UPDATE lab_settings SET email = 'kangpethias@gmail.com', updated_at = datetime('now') WHERE id = 1`,
      )
      .run();
  }
}

function ensureClientColumns(sqlite: Database.Database) {
  const cols = sqlite.prepare("PRAGMA table_info(clients)").all() as Array<{ name: string }>;
  if (cols.length === 0) return;
  const names = new Set(cols.map((col) => col.name));
  const alters: string[] = [];
  if (!names.has("lab_mrn")) alters.push("ALTER TABLE clients ADD COLUMN lab_mrn TEXT");
  if (!names.has("date_of_birth")) alters.push("ALTER TABLE clients ADD COLUMN date_of_birth TEXT");
  if (!names.has("sex")) alters.push("ALTER TABLE clients ADD COLUMN sex TEXT");
  if (!names.has("address")) alters.push("ALTER TABLE clients ADD COLUMN address TEXT");
  if (!names.has("next_of_kin")) alters.push("ALTER TABLE clients ADD COLUMN next_of_kin TEXT");
  if (!names.has("next_of_kin_phone")) {
    alters.push("ALTER TABLE clients ADD COLUMN next_of_kin_phone TEXT");
  }
  if (!names.has("active")) {
    alters.push("ALTER TABLE clients ADD COLUMN active INTEGER NOT NULL DEFAULT 1");
  }
  for (const statement of alters) {
    sqlite.exec(statement);
  }
  try {
    sqlite.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_lab_mrn ON clients(lab_mrn) WHERE lab_mrn IS NOT NULL AND lab_mrn != ''",
    );
  } catch {
    // Older SQLite builds may reject partial unique indexes — columns still work.
  }
  // Backfill stable lab MRNs for existing clients without one.
  const missing = sqlite
    .prepare("SELECT id FROM clients WHERE lab_mrn IS NULL OR trim(lab_mrn) = ''")
    .all() as Array<{ id: number }>;
  const update = sqlite.prepare("UPDATE clients SET lab_mrn = ? WHERE id = ?");
  for (const row of missing) {
    update.run(`AKL-${String(row.id).padStart(5, "0")}`, row.id);
  }
}

function createSqlite() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  // Add new columns before any DDL that references them (e.g. indexes).
  ensureClientColumns(sqlite);
  ensureLabOrderColumns(sqlite);
  sqlite.exec(SCHEMA_SQL);
  ensureClinicalTestColumns(sqlite);
  ensureInvoiceColumns(sqlite);
  ensureLabOrderColumns(sqlite);
  ensureSpecimensTable(sqlite);
  ensureClientColumns(sqlite);
  ensureLabSettingsRow(sqlite);
  return sqlite;
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __akiliSqlite?: Database.Database;
  __akiliDb?: Db;
};

function getSqlite() {
  if (!globalForDb.__akiliSqlite) {
    globalForDb.__akiliSqlite = createSqlite();
  } else {
    // Ensure newer columns exist before re-running full SCHEMA_SQL.
    ensureClientColumns(globalForDb.__akiliSqlite);
    ensureLabOrderColumns(globalForDb.__akiliSqlite);
    globalForDb.__akiliSqlite.exec(SCHEMA_SQL);
    ensureClinicalTestColumns(globalForDb.__akiliSqlite);
    ensureInvoiceColumns(globalForDb.__akiliSqlite);
    ensureLabOrderColumns(globalForDb.__akiliSqlite);
    ensureSpecimensTable(globalForDb.__akiliSqlite);
    ensureClientColumns(globalForDb.__akiliSqlite);
    ensureLabSettingsRow(globalForDb.__akiliSqlite);
  }
  return globalForDb.__akiliSqlite;
}

export function getDb() {
  const sqlite = getSqlite();
  // Always re-apply IF NOT EXISTS DDL so hot-reloaded schema additions land
  // even when a Drizzle client was already cached in the Vite process.
  ensureLabOrderColumns(sqlite);
  sqlite.exec(SCHEMA_SQL);
  ensureClinicalTestColumns(sqlite);
  ensureInvoiceColumns(sqlite);
  ensureLabOrderColumns(sqlite);
  ensureSpecimensTable(sqlite);
  ensureLabSettingsRow(sqlite);
  if (!globalForDb.__akiliDb) {
    globalForDb.__akiliDb = drizzle(sqlite, { schema });
  }
  return globalForDb.__akiliDb;
}

export function getDbPath() {
  return DB_PATH;
}
