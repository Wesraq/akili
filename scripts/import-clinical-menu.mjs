import XLSX from "xlsx";
import fs from "fs";

function isCode(value) {
  return /^[A-Z]{1,4}\d+/i.test(String(value).trim());
}

function parseHaemMicro(buf, sheetName) {
  const wb = XLSX.read(buf, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
  let category = "General";
  const items = [];

  for (const row of rows) {
    const c0 = String(row[0] ?? "").trim();
    const c1 = String(row[1] ?? "").trim();
    const cashRaw = row[2];
    const vatRaw = row[3];
    const cash = cashRaw === "" || cashRaw == null ? NaN : Number(cashRaw);
    const vat = vatRaw === "" || vatRaw == null ? NaN : Number(vatRaw);

    if (!isCode(c0) && c0 && !c1) {
      category = c0.replace(/^\d+\.\s*/, "").trim();
      continue;
    }
    if (!isCode(c0) && !c0 && c1) {
      category = c1.replace(/^\d+\.\s*/, "").trim();
      continue;
    }
    if (isCode(c0) && c1 && Number.isFinite(vat) && vat > 0) {
      items.push({
        code: c0.replace(/\s+/g, ""),
        name: c1,
        category,
        priceCashZmw: Number.isFinite(cash) ? Math.round(cash * 100) / 100 : vat,
        priceVatZmw: Math.round(vat * 100) / 100,
      });
    }
  }
  return items;
}

function parseHisto2026(buf) {
  const wb = XLSX.read(buf, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets["Table 1"], { header: 1, defval: "" });
  const cytologyNames = new Set();
  // Sheet1 marks fluids cytology vs biopsies by section headers
  const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets["Sheet1"], { header: 1, defval: "" });
  let section = "Cytology";
  const nameToSection = new Map();
  for (const row of sheet1) {
    const c2 = String(row[2] ?? "").trim().toUpperCase();
    const code = String(row[0] ?? "").trim();
    const name = String(row[1] ?? "").trim();
    if (!code && c2.includes("CYTOLOGY")) {
      section = "Cytology";
      continue;
    }
    if (!code && c2.includes("BIOPS")) {
      section = "Histopathology";
      continue;
    }
    if (name) nameToSection.set(name.toLowerCase().replace(/\s+/g, " "), section);
  }

  const items = [];
  for (const row of rows) {
    const c0 = String(row[0] ?? "").trim();
    const c1 = String(row[1] ?? "").trim();
    const price = Number(row[2]);
    if (/^AKH\d+/i.test(c0) && c1 && Number.isFinite(price)) {
      const key = c1.toLowerCase().replace(/\s+/g, " ");
      const category = nameToSection.get(key) ?? (Number(c0.replace(/\D/g, "")) <= 11 ? "Cytology" : "Histopathology");
      items.push({
        code: c0,
        name: c1,
        category,
        priceCashZmw: price,
        priceVatZmw: Math.round(price * 1.16 * 100) / 100,
      });
    }
  }
  return items;
}

const main = fs.readFileSync("C:/Users/User/Downloads/Akili Prices with VAT.xlsx");
const histo = fs.readFileSync("C:/Users/User/Downloads/HISTO AKILI PRICES 2026.xlsx");

const haem = parseHaemMicro(main, "Annex A");
const micro = parseHaemMicro(main, "ANNEX B");
const histoItems = parseHisto2026(histo);

// Prefer HISTO 2026 for histopathology/cytology; keep haem + micro from VAT workbook
const all = [...haem, ...micro, ...histoItems];
const categories = [...new Set(all.map((item) => item.category))];

const out = {
  currency: "ZMW",
  vatNote:
    "Cash prices shown. Haematology and microbiology include VAT-inclusive figures from the current tariff. Histopathology uses the 2026 cash schedule.",
  categories,
  tests: all,
};

fs.mkdirSync("src/lib", { recursive: true });
fs.writeFileSync("src/lib/clinical-menu.json", JSON.stringify(out, null, 2));
console.log({
  haem: haem.length,
  micro: micro.length,
  histo: histoItems.length,
  total: all.length,
  categories,
});
console.log(haem.slice(0, 2));
console.log(histoItems.slice(0, 2));
