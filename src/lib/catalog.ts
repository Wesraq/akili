export type LabProduct = {
  code: string;
  name: string;
  category: string;
  sample: string;
  preparation: string;
  turnaround: string;
  price: string;
  brand: string;
  brandSlug: string;
  summary: string;
  features: string[];
  warranty: string;
};

export const labCategories = [
  "Analysers",
  "Sample Handling",
  "Microbiology",
  "Immunology",
  "Molecular",
  "Histopathology",
];

export const labTests: LabProduct[] = [
  {
    code: "ANA-100",
    name: "Haematology Analyser (5-part)",
    category: "Analysers",
    sample: "Throughput up to 80 samples/hr",
    preparation: "Includes starter reagents and install kit",
    turnaround: "Lead time 2-4 weeks",
    price: "18500.00",
    brand: "Mindray",
    brandSlug: "mindray",
    summary: "Five-part differential haematology analyser for mid-volume hospital and private labs.",
    features: [
      "CBC with 5-part differential",
      "Closed-tube sampling option",
      "LIS connectivity",
      "Starter reagent kit included",
    ],
    warranty: "12 months parts and labour",
  },
  {
    code: "ANA-210",
    name: "Chemistry Analyser - Mid Volume",
    category: "Analysers",
    sample: "Discrete, open-reagent system",
    preparation: "IQ/OQ documentation pack available",
    turnaround: "Lead time 3-5 weeks",
    price: "24900.00",
    brand: "Mindray",
    brandSlug: "mindray",
    summary: "Discrete chemistry platform for routine chemistry panels in hospital laboratories.",
    features: [
      "Open reagent system",
      "STAT sample interrupt",
      "Calibration and QC workflows",
      "IQ/OQ pack available",
    ],
    warranty: "12 months parts and labour",
  },
  {
    code: "SAM-215",
    name: "Automated Sample Sorter",
    category: "Sample Handling",
    sample: "Barcode-driven pre-analytics",
    preparation: "Bench-top or floor-standing options",
    turnaround: "Lead time 4-6 weeks",
    price: "16200.00",
    brand: "Automation platforms",
    brandSlug: "automation",
    summary: "Barcode-driven sample sorting to reduce pre-analytical errors and manual handling.",
    features: ["Barcode reading", "Route-by-test rules", "Bench or floor options", "LIS flags"],
    warranty: "12 months parts",
  },
  {
    code: "SAM-330",
    name: "Centrifuge - Refrigerated",
    category: "Sample Handling",
    sample: "24-place rotor, refrigerated",
    preparation: "Calibration certificate included",
    turnaround: "Lead time 1-2 weeks",
    price: "4200.00",
    brand: "Sample prep",
    brandSlug: "sample-prep",
    summary: "Refrigerated centrifuge for serum and plasma preparation in clinical labs.",
    features: ["24-place rotor", "Refrigerated chamber", "Imbalance detection", "Calibration certificate"],
    warranty: "12 months parts",
  },
  {
    code: "MIC-410",
    name: "Biosafety Cabinet Class II A2",
    category: "Microbiology",
    sample: "1.2 m working width",
    preparation: "HEPA filters and UV option",
    turnaround: "Lead time 3-5 weeks",
    price: "9800.00",
    brand: "Containment",
    brandSlug: "containment",
    summary: "Class II A2 cabinet for microbiology and molecular sample prep containment.",
    features: ["HEPA filtration", "UV option", "1.2 m width", "Alarm monitoring"],
    warranty: "12 months parts and labour",
  },
  {
    code: "MIC-455",
    name: "Incubator - CO2",
    category: "Microbiology",
    sample: "180 L chamber, IR CO2 sensor",
    preparation: "Shelving and water pan included",
    turnaround: "Lead time 2-3 weeks",
    price: "5600.00",
    brand: "Incubation",
    brandSlug: "incubation",
    summary: "CO2 incubator for culture work in microbiology and research labs.",
    features: ["180 L chamber", "IR CO2 sensor", "Shelving included", "Over-temp protection"],
    warranty: "12 months parts",
  },
  {
    code: "IMM-520",
    name: "ELISA Microplate Reader",
    category: "Immunology",
    sample: "96-well, multi-wavelength",
    preparation: "PC software licence included",
    turnaround: "Lead time 2-4 weeks",
    price: "7100.00",
    brand: "Immunoassay",
    brandSlug: "immunoassay",
    summary: "Multi-wavelength ELISA reader for immunology and infectious-disease assays.",
    features: ["96-well format", "Multi-wavelength", "PC software", "Exportable results"],
    warranty: "12 months parts",
  },
  {
    code: "IMM-560",
    name: "Plate Washer - Automated",
    category: "Immunology",
    sample: "8/12-channel manifold",
    preparation: "Compatible with standard plates",
    turnaround: "Lead time 2-3 weeks",
    price: "3900.00",
    brand: "Immunoassay",
    brandSlug: "immunoassay",
    summary: "Automated plate washer for ELISA workflows in diagnostic labs.",
    features: ["8/12-channel manifold", "Programmable wash cycles", "Standard plate support"],
    warranty: "12 months parts",
  },
  {
    code: "MOL-610",
    name: "Real-Time PCR System",
    category: "Molecular",
    sample: "96-well block, 5-channel detection",
    preparation: "Installation and operator training",
    turnaround: "Lead time 4-8 weeks",
    price: "28500.00",
    brand: "Molecular platforms",
    brandSlug: "molecular",
    summary: "Real-time PCR platform for molecular diagnostics and pathogen panels.",
    features: [
      "96-well block",
      "5-channel detection",
      "Install and training options",
      "Assay flexibility",
    ],
    warranty: "12 months parts and labour",
  },
  {
    code: "MOL-640",
    name: "Nucleic Acid Extractor",
    category: "Molecular",
    sample: "32-sample magnetic bead workflow",
    preparation: "Starter kit of consumables",
    turnaround: "Lead time 3-5 weeks",
    price: "14200.00",
    brand: "Molecular platforms",
    brandSlug: "molecular",
    summary: "Magnetic-bead nucleic acid extractor for molecular sample preparation.",
    features: ["32-sample capacity", "Magnetic bead workflow", "Starter consumables", "Protocol library"],
    warranty: "12 months parts",
  },
  {
    code: "HIS-710",
    name: "Tissue Processor - Automated",
    category: "Histopathology",
    sample: "Up to 300 cassettes per run",
    preparation: "Reagent bottles and baskets included",
    turnaround: "Lead time 5-7 weeks",
    price: "22100.00",
    brand: "Histopathology",
    brandSlug: "histopathology",
    summary: "Automated tissue processor for histopathology departments.",
    features: ["Up to 300 cassettes", "Reagent management", "Baskets included", "Programmable schedules"],
    warranty: "12 months parts and labour",
  },
  {
    code: "HIS-150",
    name: "Microtome - Rotary",
    category: "Histopathology",
    sample: "Section thickness 0.5-100 um",
    preparation: "Disposable blade holder included",
    turnaround: "Lead time 1-3 weeks",
    price: "4800.00",
    brand: "Histopathology",
    brandSlug: "histopathology",
    summary: "Rotary microtome for routine paraffin sectioning in histopathology.",
    features: ["0.5-100 um sections", "Disposable blade holder", "Precision advance", "Safety guard"],
    warranty: "12 months parts",
  },
];

export function getLabProductByCode(code: string) {
  return labTests.find((item) => item.code.toLowerCase() === code.toLowerCase());
}

export type Brand = {
  slug: string;
  name: string;
  focus: string;
  summary: string;
  productCodes: string[];
};

export const brands: Brand[] = [
  {
    slug: "mindray",
    name: "Mindray",
    focus: "Haematology, chemistry and ultrasound",
    summary:
      "Analysers and imaging systems commonly sourced for hospital labs and clinics across our markets.",
    productCodes: ["ANA-100", "ANA-210"],
  },
  {
    slug: "molecular",
    name: "Molecular platforms",
    focus: "PCR and extraction",
    summary: "Real-time PCR and nucleic acid extraction systems for molecular diagnostics labs.",
    productCodes: ["MOL-610", "MOL-640"],
  },
  {
    slug: "histopathology",
    name: "Histopathology platforms",
    focus: "Tissue processing and microtomy",
    summary: "Processors and microtomes for pathology departments and teaching hospitals.",
    productCodes: ["HIS-710", "HIS-150"],
  },
  {
    slug: "immunoassay",
    name: "Immunoassay platforms",
    focus: "ELISA readers and washers",
    summary: "Plate readers and washers for immunology and infectious-disease testing labs.",
    productCodes: ["IMM-520", "IMM-560"],
  },
  {
    slug: "containment",
    name: "Containment & safety",
    focus: "Biosafety cabinets",
    summary: "Class II cabinets and related containment equipment for microbiology suites.",
    productCodes: ["MIC-410"],
  },
  {
    slug: "incubation",
    name: "Incubation",
    focus: "CO2 and culture incubators",
    summary: "Incubators for microbiology culture and research laboratory workflows.",
    productCodes: ["MIC-455"],
  },
  {
    slug: "sample-prep",
    name: "Sample preparation",
    focus: "Centrifuges and pre-analytics",
    summary: "Centrifuges and sample-handling equipment for day-to-day laboratory workflows.",
    productCodes: ["SAM-330", "SAM-215"],
  },
  {
    slug: "automation",
    name: "Lab automation",
    focus: "Pre-analytical sorting",
    summary: "Sample sorting and workflow automation for higher-throughput laboratories.",
    productCodes: ["SAM-215"],
  },
];

export function getBrandBySlug(slug: string) {
  return brands.find((brand) => brand.slug === slug);
}

export const downloads = [
  {
    title: "AKILI LABS company profile",
    type: "PDF",
    size: "1.2 MB",
    href: `mailto:kangpethias@gmail.com?subject=${encodeURIComponent("Request: company profile PDF")}`,
    description: "Overview of our distribution markets, product lines and service model.",
  },
  {
    title: "Laboratory equipment catalogue",
    type: "PDF",
    size: "3.4 MB",
    href: `mailto:kangpethias@gmail.com?subject=${encodeURIComponent("Request: lab catalogue PDF")}`,
    description: "Current analysers, sample handling, molecular and histopathology systems.",
  },
  {
    title: "Installation and IQ/OQ checklist",
    type: "PDF",
    size: "480 KB",
    href: `mailto:kangpethias@gmail.com?subject=${encodeURIComponent("Request: IQ/OQ checklist")}`,
    description: "Site readiness and commissioning checklist for capital equipment.",
  },
  {
    title: "Service and warranty terms",
    type: "PDF",
    size: "320 KB",
    href: `mailto:kangpethias@gmail.com?subject=${encodeURIComponent("Request: service terms")}`,
    description: "Warranty cover, response targets and spare-parts policy.",
  },
];

export const servicePlans = [
  {
    name: "Commissioning",
    body: "Delivery, unpacking, install, basic configuration and handover documentation.",
  },
  {
    name: "Operator training",
    body: "On-site or classroom sessions for biomedical and laboratory staff.",
  },
  {
    name: "Preventive maintenance",
    body: "Scheduled visits, calibration checks and consumable planning.",
  },
  {
    name: "Breakdown support",
    body: "Remote triage plus field engineer dispatch for covered platforms.",
  },
  {
    name: "Spare parts",
    body: "Approved parts stocking advice and priority ordering for critical devices.",
  },
  {
    name: "Warranty extensions",
    body: "Optional cover beyond the standard 12-month capital equipment warranty.",
  },
];

export const aboutPoints = [
  {
    title: "Clinical lab services",
    body: "AKILI LABS runs diagnostic testing for patients and referring clinics - haematology, chemistry, immunology, infectious disease and more.",
  },
  {
    title: "Equipment & utensils",
    body: "We also supply laboratory analysers, hospital devices, surgical instruments, consumables and clinic utensils across the region.",
  },
  {
    title: "Where we work",
    body: "Zambia, Malawi, Mozambique, Tanzania, Central African Republic and Kenya - with coordination hubs in each market.",
  },
  {
    title: "How we work with you",
    body: "Book a test or request an equipment quote. Purchase orders, institutional billing and service contracts welcome.",
  },
];

export const clinicalServiceLines = [
  {
    title: "Diagnostic laboratory",
    body: "Routine and specialised lab tests for individuals, clinics and institutional programmes.",
    points: ["Haematology & chemistry", "Immunology & serology", "Infectious disease panels"],
  },
  {
    title: "Sample collection",
    body: "Walk-in and scheduled collection at our hubs, with referral workflows for partner facilities.",
    points: ["Phlebotomy", "Same-day routine panels", "Result reporting to clinicians"],
  },
  {
    title: "Equipment supply",
    body: "Analysers, hospital devices, surgical utensils and consumables - supplied, installed and supported.",
    points: ["Lab capital equipment", "Clinic & ward devices", "Install, train & maintain"],
  },
];
