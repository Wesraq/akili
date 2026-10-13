import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const staffUsers = sqliteTable("staff_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "staff"] }).notNull().default("staff"),
  passwordHash: text("password_hash").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/** Singleton lab / organisation settings (row id = 1). */
export const labSettings = sqliteTable("lab_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgName: text("org_name").notNull().default("AKILI LABS"),
  tagline: text("tagline").notNull().default("Clinical Testing & Lab Supply"),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  hours: text("hours").notNull().default(""),
  currency: text("currency").notNull().default("ZMW"),
  vatRate: real("vat_rate").notNull().default(16),
  invoiceFooter: text("invoice_footer").notNull().default(""),
  reportFooter: text("report_footer").notNull().default(""),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedBy: integer("updated_by").references(() => staffUsers.id),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => staffUsers.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["individual", "organisation"] }).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  nationalId: text("national_id"),
  /** Lab medical record / patient registry number (AKL-#####). */
  labMrn: text("lab_mrn"),
  dateOfBirth: text("date_of_birth"),
  sex: text("sex", { enum: ["male", "female", "other", "unknown"] }),
  address: text("address"),
  nextOfKin: text("next_of_kin"),
  nextOfKinPhone: text("next_of_kin_phone"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => staffUsers.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  scheduledAt: text("scheduled_at").notNull(),
  serviceType: text("service_type").notNull(),
  status: text("status", {
    enum: ["scheduled", "completed", "cancelled", "no_show"],
  })
    .notNull()
    .default("scheduled"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => staffUsers.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const clinicalTests = sqliteTable("clinical_tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  sampleType: text("sample_type").notNull(),
  turnaround: text("turnaround").notNull(),
  /** Internal / invoice unit price (kept in sync with VAT-inclusive ZMW). */
  price: real("price").notNull().default(0),
  priceCashZmw: real("price_cash_zmw").notNull().default(0),
  priceVatZmw: real("price_vat_zmw").notNull().default(0),
  /** Available for lab ordering in CRM. */
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  /** Visible on the public website tariff menu. */
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  /** Default result unit shown when entering lab results. */
  resultUnit: text("result_unit").notNull().default(""),
  /** Reference / normal range shown on reports. */
  referenceRange: text("reference_range").notNull().default(""),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const labOrders = sqliteTable("lab_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  /** Human-readable accession ID (ACC-YYYY-#####). */
  accessionNumber: text("accession_number"),
  orderedAt: text("ordered_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  status: text("status", {
    enum: [
      "ordered",
      "received",
      "in_progress",
      "reported",
      "validated",
      "rejected",
      "amended",
      "cancelled",
    ],
  })
    .notNull()
    .default("ordered"),
  notes: text("notes"),
  orderedBy: integer("ordered_by").references(() => staffUsers.id),
  /** Staff who submitted results for validation. */
  resultsEnteredBy: integer("results_entered_by").references(() => staffUsers.id),
  /** Staff who validated/approved the reported results. */
  validatedBy: integer("validated_by").references(() => staffUsers.id),
  validatedAt: text("validated_at"),
  /** FORM-11 / FORM-14 reception fields */
  patientNumber: text("patient_number"),
  age: text("age"),
  sex: text("sex"),
  ward: text("ward"),
  specimenType: text("specimen_type"),
  /** FORM-14 JSON array of marked anatomical extraction sites. */
  specimenSites: text("specimen_sites"),
  requestingDoctor: text("requesting_doctor"),
  receivedFrom: text("received_from"),
  broughtBy: text("brought_by"),
  receivedByName: text("received_by_name"),
  sponsor: text("sponsor"),
  dateCollected: text("date_collected"),
  contactNumber: text("contact_number"),
  /** FORM-12 / FORM-21 section + reporting time */
  section: text("section"),
  reportingTime: text("reporting_time"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/** Specimens linked to a lab accession (order). */
export const specimens = sqliteTable("specimens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => labOrders.id, { onDelete: "cascade" }),
  specimenType: text("specimen_type").notNull().default(""),
  collectedAt: text("collected_at"),
  receivedAt: text("received_at"),
  condition: text("condition"),
  status: text("status", {
    enum: ["pending", "received", "rejected", "consumed"],
  })
    .notNull()
    .default("pending"),
  rejectedReason: text("rejected_reason"),
  barcode: text("barcode"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const labOrderItems = sqliteTable("lab_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => labOrders.id, { onDelete: "cascade" }),
  testId: integer("test_id")
    .notNull()
    .references(() => clinicalTests.id),
  resultValue: text("result_value"),
  resultUnit: text("result_unit"),
  resultFlag: text("result_flag"),
  reportedAt: text("reported_at"),
  notes: text("notes"),
  /** FORM-12 MICRO columns */
  urinalysis: text("urinalysis"),
  microscopy: text("microscopy"),
  culture: text("culture"),
  sensitivity: text("sensitivity"),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: integer("actor_id").references(() => staffUsers.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  at: text("at")
    .notNull()
    .default(sql`(datetime('now'))`),
  meta: text("meta"),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  source: text("source", {
    enum: ["quote", "collection", "contact", "services", "other"],
  })
    .notNull()
    .default("quote"),
  status: text("status", {
    enum: ["new", "contacted", "qualified", "converted", "closed"],
  })
    .notNull()
    .default("new"),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  orgName: text("org_name"),
  interest: text("interest"),
  preferredDate: text("preferred_date"),
  address: text("address"),
  notes: text("notes"),
  clientId: integer("client_id").references(() => clients.id),
  assignedTo: integer("assigned_to").references(() => staffUsers.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const equipmentOrders = sqliteTable("equipment_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  leadId: integer("lead_id").references(() => leads.id),
  orderedAt: text("ordered_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  status: text("status", {
    enum: ["quoted", "confirmed", "fulfilling", "delivered", "cancelled"],
  })
    .notNull()
    .default("quoted"),
  notes: text("notes"),
  orderedBy: integer("ordered_by").references(() => staffUsers.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const equipmentOrderItems = sqliteTable("equipment_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => equipmentOrders.id, { onDelete: "cascade" }),
  productCode: text("product_code").notNull(),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  brand: text("brand"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull().default(0),
  notes: text("notes"),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  sourceType: text("source_type", {
    enum: ["lab_order", "equipment_order", "manual"],
  })
    .notNull()
    .default("manual"),
  sourceId: integer("source_id"),
  status: text("status", {
    enum: ["draft", "issued", "paid", "void"],
  })
    .notNull()
    .default("draft"),
  issuedAt: text("issued_at"),
  dueAt: text("due_at"),
  notes: text("notes"),
  subtotal: real("subtotal").notNull().default(0),
  tax: real("tax").notNull().default(0),
  total: real("total").notNull().default(0),
  createdBy: integer("created_by").references(() => staffUsers.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const invoiceLines = sqliteTable("invoice_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type StaffUser = typeof staffUsers.$inferSelect;
export type LabSettings = typeof labSettings.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type ClinicalTest = typeof clinicalTests.$inferSelect;
export type LabOrder = typeof labOrders.$inferSelect;
export type Specimen = typeof specimens.$inferSelect;
export type LabOrderItem = typeof labOrderItems.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type EquipmentOrder = typeof equipmentOrders.$inferSelect;
export type EquipmentOrderItem = typeof equipmentOrderItems.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
