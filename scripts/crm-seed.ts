import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import fs from "node:fs";

import { getDb, getDbPath } from "../src/crm/db/client";
import { CLINICAL_TEST_SEED } from "../src/crm/db/seed-data";
import { clinicalTests, staffUsers } from "../src/crm/db/schema";

const email = (process.env["CRM_ADMIN_EMAIL"] ?? "admin@akililabs.local").toLowerCase();
const password = process.env["CRM_ADMIN_PASSWORD"] ?? "AkiliAdmin1!";
const name = process.env["CRM_ADMIN_NAME"] ?? "CRM Admin";

type MenuFile = {
  tests: Array<{
    code: string;
    name: string;
    category: string;
    priceCashZmw: number;
    priceVatZmw: number;
  }>;
};

async function main() {
  const db = getDb();
  console.log(`Seeding CRM database at ${getDbPath()}`);

  const existing = db.select().from(staffUsers).where(eq(staffUsers.email, email)).get();
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    db.insert(staffUsers)
      .values({
        email,
        name,
        role: "admin",
        passwordHash,
        active: true,
      })
      .run();
    console.log(`Created admin user: ${email}`);
  } else {
    console.log(`Admin user already exists: ${email}`);
  }

  for (const test of CLINICAL_TEST_SEED) {
    const found = db.select().from(clinicalTests).where(eq(clinicalTests.code, test.code)).get();
    if (!found) {
      db.insert(clinicalTests)
        .values({
          code: test.code,
          name: test.name,
          category: test.category,
          sampleType: test.sampleType,
          turnaround: test.turnaround,
          price: test.price,
          priceCashZmw: test.price,
          priceVatZmw: test.price,
          active: true,
          published: false,
        })
        .run();
    }
  }

  const menuPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/lib/clinical-menu.json");
  if (fs.existsSync(menuPath)) {
    const menu = JSON.parse(fs.readFileSync(menuPath, "utf8")) as MenuFile;
    let inserted = 0;
    let updated = 0;
    for (const test of menu.tests) {
      const code = test.code.toUpperCase();
      const found = db.select().from(clinicalTests).where(eq(clinicalTests.code, code)).get();
      if (!found) {
        db.insert(clinicalTests)
          .values({
            code,
            name: test.name,
            category: test.category,
            sampleType: "As advised by lab",
            turnaround: "Ask lab",
            price: test.priceVatZmw,
            priceCashZmw: test.priceCashZmw,
            priceVatZmw: test.priceVatZmw,
            active: true,
            published: true,
          })
          .run();
        inserted += 1;
      } else {
        db.update(clinicalTests)
          .set({
            name: test.name,
            category: test.category,
            price: test.priceVatZmw,
            priceCashZmw: test.priceCashZmw,
            priceVatZmw: test.priceVatZmw,
            published: true,
            active: true,
          })
          .where(eq(clinicalTests.id, found.id))
          .run();
        updated += 1;
      }
    }
    console.log(`Tariff menu synced: ${inserted} inserted, ${updated} updated (${menu.tests.length} total).`);
  } else {
    console.log("No clinical-menu.json found — skipped website tariff sync.");
  }

  console.log(`Legacy clinical seed ready (${CLINICAL_TEST_SEED.length} codes if missing).`);
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
