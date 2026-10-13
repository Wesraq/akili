export type ClinicalTariff = {
  code: string;
  name: string;
  category: string;
  priceCashZmw: number;
  priceVatZmw: number;
  sampleType?: string;
  turnaround?: string;
};

export const clinicalMenuVatNote =
  "Cash prices shown in ZMW. Haematology and microbiology include VAT-inclusive figures. Histopathology uses the current cash schedule.";

export const clinicalDepartments = [
  {
    id: "haematology",
    title: "Haematology & coagulation",
    summary: "Blood counts, grouping, sickling and clotting studies for routine and urgent care.",
    categories: ["Haematology", "Coagulation"],
  },
  {
    id: "chemistry",
    title: "Clinical chemistry",
    summary: "Kidney, liver, lipids, glucose, cardiac and endocrine panels for diagnostic workups.",
    categories: [
      "Kidney Function",
      "Electrolytes",
      "Liver Function Test",
      "Pancreas / GIT",
      "Bone",
      "Glucose Metabolism",
      "Lipids",
      "Cardiac Markers",
      "Inflammatory Markers",
      "Thyroid",
      "Hormones",
      "Tumor Markers",
      "Other",
      "Chemistry",
      "Immunology",
      "Urinalysis",
    ],
  },
  {
    id: "microbiology",
    title: "Microbiology & infectious disease",
    summary: "Cultures, GeneXpert, malaria, hepatitis, TB and antenatal infectious screens.",
    categories: [
      "Microbiology",
      "Infectious Diseases",
      "Hepatitis",
      "Syphilis",
      "TB",
      "Malaria",
      "Torche/Pregnancy",
    ],
  },
  {
    id: "histo",
    title: "Histopathology & cytology",
    summary: "PAP smears, fluid cytology and tissue biopsies with the published cash schedule.",
    categories: ["Cytology", "Histopathology"],
  },
] as const;

export function formatZmw(value: number, currency = "ZMW") {
  const code = (currency || "ZMW").trim().toUpperCase() || "ZMW";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "ZMW" ? 0 : 2,
    }).format(value);
  } catch {
    return `${code} ${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: code === "ZMW" ? 0 : 2,
    }).format(value)}`;
  }
}

export function testsForDepartment(
  tests: ClinicalTariff[],
  departmentId: (typeof clinicalDepartments)[number]["id"],
) {
  const department = clinicalDepartments.find((item) => item.id === departmentId);
  if (!department) return [];
  return tests.filter((test) =>
    (department.categories as readonly string[]).includes(test.category),
  );
}

export function departmentForCategory(category: string) {
  return clinicalDepartments.find((dept) =>
    (dept.categories as readonly string[]).includes(category),
  );
}

export function featuredFromTariffs(tests: ClinicalTariff[], codes: string[] = ["H001", "B001", "M001", "M011", "AKH001", "AKH012"]) {
  return codes
    .map((code) => tests.find((test) => test.code.toUpperCase() === code.toUpperCase()))
    .filter(Boolean) as ClinicalTariff[];
}
