import labChemistry from "@/assets/lab-chemistry.jpg";
import labHaematology from "@/assets/lab-haematology.jpg";
import labHistopathology from "@/assets/lab-histopathology.jpg";
import labMolecular from "@/assets/lab-molecular.jpg";
import { clinicalDepartments, type ClinicalTariff } from "@/lib/clinical-menu";

export type ClinicalServiceSlug = (typeof clinicalDepartments)[number]["id"];

export type ClinicalServicePage = {
  slug: ClinicalServiceSlug;
  title: string;
  shortTitle: string;
  summary: string;
  heroImage: string;
  heroAlt: string;
  intro: string;
  whoFor: string[];
  whatWeOffer: string[];
  sampleNotes: string[];
  turnaroundNote: string;
  gallery: { src: string; alt: string; caption: string }[];
};

const byId = Object.fromEntries(clinicalDepartments.map((d) => [d.id, d])) as Record<
  ClinicalServiceSlug,
  (typeof clinicalDepartments)[number]
>;

export const clinicalServicePages: ClinicalServicePage[] = [
  {
    slug: "haematology",
    title: byId.haematology.title,
    shortTitle: "Haematology",
    summary: byId.haematology.summary,
    heroImage: labHaematology,
    heroAlt: "Haematology laboratory with blood analysers and sample tubes",
    intro:
      "Our haematology and coagulation bench supports routine blood counts, blood grouping, sickling screens and clotting studies for walk-in patients, clinics and hospital referrals.",
    whoFor: [
      "Patients referred for FBC, grouping or clotting studies",
      "Clinics and hospitals needing same-day or urgent blood work",
      "Antenatal and surgical pre-assessment pathways",
    ],
    whatWeOffer: [
      "Full blood count and differential reporting",
      "ABO / Rh grouping and sickling screens",
      "Coagulation panels for bleeding and thrombosis workups",
      "Clear cash tariffs published on our test menu",
    ],
    sampleNotes: [
      "EDTA (purple top) for most haematology tests",
      "Citrate (blue top) for coagulation — fill to the mark",
      "Label with full name, age/sex and collection time",
    ],
    turnaroundNote: "Many routine haematology results are available the same day when samples arrive before the cut-off.",
    gallery: [
      {
        src: labHaematology,
        alt: "Automated haematology analyser on the AKILI LABS bench",
        caption: "Blood analysers for high-volume and urgent counts",
      },
      {
        src: labChemistry,
        alt: "Sample handling area supporting haematology accession",
        caption: "Accession and sample handling alongside the blood bench",
      },
    ],
  },
  {
    slug: "chemistry",
    title: byId.chemistry.title,
    shortTitle: "Chemistry",
    summary: byId.chemistry.summary,
    heroImage: labChemistry,
    heroAlt: "Clinical chemistry laboratory with automated analysers",
    intro:
      "Clinical chemistry covers kidney, liver, lipids, glucose, cardiac markers, hormones and related panels used in diagnostic workups and chronic disease monitoring.",
    whoFor: [
      "Patients with metabolic, renal, liver or endocrine investigations",
      "Facilities referring chemistry panels and specialty markers",
      "Programmes needing consistent cash pricing in ZMW",
    ],
    whatWeOffer: [
      "Kidney, liver, electrolyte and lipid panels",
      "Glucose metabolism and cardiac markers",
      "Thyroid, hormones and selected tumor markers",
      "Immunology and urinalysis support where listed on the menu",
    ],
    sampleNotes: [
      "Serum / plasma as indicated on each test",
      "Fasting may be required for glucose and lipids — ask when booking",
      "Keep samples upright and protected from extreme heat",
    ],
    turnaroundNote: "Routine chemistry panels typically report within one working day; specialty markers may take longer.",
    gallery: [
      {
        src: labChemistry,
        alt: "Clinical chemistry analysers and reagent systems",
        caption: "Automated chemistry for hospital and clinic referrals",
      },
      {
        src: labHaematology,
        alt: "Shared laboratory workbench for sample preparation",
        caption: "Shared accession supporting chemistry sample prep",
      },
    ],
  },
  {
    slug: "microbiology",
    title: byId.microbiology.title,
    shortTitle: "Microbiology",
    summary: byId.microbiology.summary,
    heroImage: labMolecular,
    heroAlt: "Molecular and microbiology laboratory workspace",
    intro:
      "Microbiology and infectious disease testing includes cultures, GeneXpert, malaria, hepatitis, TB and antenatal infectious screens for clinical and public-health pathways.",
    whoFor: [
      "Patients with suspected infection or fever workups",
      "Antenatal and infectious disease programmes",
      "Clinics needing culture, malaria or molecular results",
    ],
    whatWeOffer: [
      "Culture and sensitivity where indicated",
      "Malaria, hepatitis, syphilis and TB-related tests",
      "GeneXpert and molecular options on the published menu",
      "Torche / pregnancy infectious screens",
    ],
    sampleNotes: [
      "Collect into the correct container for the test requested",
      "Sputum, blood culture and swab instructions available on request",
      "Transport promptly — tell reception if antibiotics have started",
    ],
    turnaroundNote: "Rapid screens can be same day; cultures and molecular assays follow the published turnaround for each test.",
    gallery: [
      {
        src: labMolecular,
        alt: "Molecular diagnostics bench for infectious disease testing",
        caption: "Molecular and infectious disease workspaces",
      },
      {
        src: labChemistry,
        alt: "Laboratory sample processing supporting microbiology",
        caption: "Controlled sample processing for culture and screens",
      },
    ],
  },
  {
    slug: "histo",
    title: byId.histo.title,
    shortTitle: "Histopathology",
    summary: byId.histo.summary,
    heroImage: labHistopathology,
    heroAlt: "Histopathology laboratory with microtomy and tissue processing",
    intro:
      "Histopathology and cytology services cover PAP smears, fluid cytology and tissue biopsies, reported against our published cash schedule.",
    whoFor: [
      "Patients referred for PAP smear or cytology",
      "Clinicians sending biopsies and fluid specimens",
      "Facilities needing pathology support without an in-house histo lab",
    ],
    whatWeOffer: [
      "Cervical cytology (PAP) and fluid cytology",
      "Tissue biopsy processing and reporting",
      "Clear cash tariffs for histopathology items",
      "Coordination with requesting clinicians on urgent cases",
    ],
    sampleNotes: [
      "Fix tissue in formalin unless otherwise instructed",
      "Label container and request form with site and clinical history",
      "Cytology samples need the correct preservative medium",
    ],
    turnaroundNote: "Cytology and histopathology turnaround depends on specimen type; urgent cases should be flagged at reception.",
    gallery: [
      {
        src: labHistopathology,
        alt: "Histopathology microtomy and tissue processing area",
        caption: "Tissue processing and microtomy for pathology",
      },
      {
        src: labMolecular,
        alt: "Supporting laboratory space for cytology preparation",
        caption: "Preparation areas supporting cytology workflows",
      },
    ],
  },
];

export function getClinicalServiceBySlug(slug: string) {
  return clinicalServicePages.find((page) => page.slug === slug) ?? null;
}

export function featuredTestsForService(tests: ClinicalTariff[], slug: ClinicalServiceSlug, limit = 8) {
  const dept = clinicalDepartments.find((item) => item.id === slug);
  if (!dept) return [];
  return tests
    .filter((test) => (dept.categories as readonly string[]).includes(test.category))
    .slice(0, limit);
}
