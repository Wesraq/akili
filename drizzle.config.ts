import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/crm/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env["CRM_DB_PATH"] ?? "./data/akili.db",
  },
});
