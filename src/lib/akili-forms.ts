/**
 * Field catalogue derived from AKILI LABS paper worksheets:
 * - FORM-11 Sample reception
 * - FORM-12 Haematology & chemistry reporting
 * - FORM-12 Microbiology reporting
 * - FORM-14 Histopathology sample receipt log
 * - FORM-21 Serology reporting sheet
 */

export const labSections = [
  { id: "haem_chem", label: "Haematology & chemistry", form: "FORM-12 Reporting WS" },
  { id: "microbiology", label: "Microbiology", form: "FORM-12 MICRO" },
  { id: "serology", label: "Serology", form: "FORM-21" },
  { id: "histopathology", label: "Histopathology", form: "FORM-14" },
] as const;

export type LabSectionId = (typeof labSections)[number]["id"];

/** Client-profile form views — include reception (FORM-11) plus section worksheets. */
export const clientFormViews = [
  {
    id: "reception",
    label: "FORM-11 Sample reception",
    description: "Reception log for all samples received for this client",
    section: null as LabSectionId | null,
  },
  {
    id: "haem_chem",
    label: "FORM-12 Haematology & chemistry",
    description: "Reporting worksheet for haem / chem orders",
    section: "haem_chem" as LabSectionId,
  },
  {
    id: "microbiology",
    label: "FORM-12 Microbiology",
    description: "Urinalysis, microscopy, culture and sensitivity",
    section: "microbiology" as LabSectionId,
  },
  {
    id: "serology",
    label: "FORM-21 Serology",
    description: "Serology reporting sheet",
    section: "serology" as LabSectionId,
  },
  {
    id: "histopathology",
    label: "FORM-14 Histopathology log",
    description: "Histo / cytology sample receipt and reporting",
    section: "histopathology" as LabSectionId,
  },
] as const;

export type ClientFormViewId = (typeof clientFormViews)[number]["id"];

export function formViewForSection(section: string | null | undefined): ClientFormViewId {
  if (!section) return "reception";
  const match = clientFormViews.find((view) => view.section === section);
  return match?.id ?? "reception";
}

export function sectionLabel(section: string | null | undefined) {
  return labSections.find((item) => item.id === section)?.label || section || "Reception";
}

export function sectionFromDepartmentTitle(title: string): LabSectionId | null {
  const t = title.toLowerCase();
  if (t.includes("haemat") || t.includes("chem")) return "haem_chem";
  if (t.includes("micro")) return "microbiology";
  if (t.includes("histo") || t.includes("cyto")) return "histopathology";
  if (t.includes("serol") || t.includes("immun") || t.includes("infect")) return "serology";
  return null;
}

export function sectionFromCategory(category: string): LabSectionId {
  const c = category.toLowerCase();
  if (c.includes("histo") || c.includes("cyto")) return "histopathology";
  if (
    c.includes("micro") ||
    c.includes("malaria") ||
    c.includes("tb") ||
    c.includes("urine") ||
    c.includes("infect")
  ) {
    return "microbiology";
  }
  if (
    c.includes("serol") ||
    c.includes("hepatitis") ||
    c.includes("syphilis") ||
    c.includes("hiv") ||
    c.includes("immun") ||
    c.includes("torche")
  ) {
    return "serology";
  }
  return "haem_chem";
}

/** Labels used on booking + LIMS screens (match paper forms). */
export const formFieldLabels = {
  patientName: "Patient name",
  patientNumber: "Patient / MR number",
  age: "Age",
  sex: "Sex",
  contactNumber: "Contact number",
  testsRequested: "Tests requested",
  specimenType: "Specimen type",
  specimenSites: "Extraction sites",
  receivedFrom: "Received from",
  broughtBy: "Brought by",
  deliveredBy: "Delivered by",
  receivedBy: "Received by",
  requestingDoctor: "Requesting doctor",
  ward: "Ward",
  sponsor: "Sponsor",
  dateCollected: "Date collected",
  dateReceived: "Date received",
  labNumber: "Lab number",
  reportingTime: "Reporting time",
  resultsEnteredBy: "Results entered by",
  checkedBy: "Checked by",
  authorisedBy: "Authorised by",
  urinalysis: "Urinalysis",
  microscopy: "M (Microscopy)",
  culture: "C (Culture)",
  sensitivity: "S (Sensitivity)",
  section: "Section / bench",
} as const;
