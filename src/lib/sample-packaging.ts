/**
 * Specimen packaging guidance for patients, clinics and hospitals
 * bringing or courier-sending samples to AKILI LABS.
 *
 * Field model on booking:
 * - Sample = specimen material (Blood, Urine, Swab, …)
 * - Sample type = preparation / fraction (Whole blood, Plasma, Serum, …)
 *
 * Tube colours follow common BD Vacutainer / ISO practice
 * (lavender/purple = EDTA; gold/SST or red = serum; light blue = citrate).
 */

export type PackagingTip = {
  /** Short label shown in the nugget heading */
  tubeLabel: string;
  /** Patient / clinic facing instruction */
  tip: string;
  /** Accent for the nugget chip */
  accent: "purple" | "gold" | "blue" | "grey" | "green" | "neutral";
};

const DEFAULT_TIP: PackagingTip = {
  tubeLabel: "As advised by the lab",
  tip: "Use the container confirmed for this test. Cap tightly, keep upright, and deliver promptly with patient identifiers on every tube.",
  accent: "neutral",
};

export function packagingForSampleType(sampleType: string | null | undefined): PackagingTip {
  const s = (sampleType ?? "").toLowerCase();
  if (!s.trim()) return DEFAULT_TIP;

  if (
    s.includes("edta") ||
    s.includes("whole blood") ||
    s.includes("capillary") ||
    s.includes("haemat") ||
    s.includes("cbc")
  ) {
    return {
      tubeLabel: "Purple / lavender top (EDTA)",
      tip: "Deliver whole blood in a purple-top (EDTA) vacuum tube. Invert gently 8–10 times after draw — do not shake. Keep upright at room temperature unless cold chain is requested. Do not freeze whole blood.",
      accent: "purple",
    };
  }

  if (s.includes("citrate") || s.includes("coag")) {
    return {
      tubeLabel: "Light blue top (citrate)",
      tip: "Use a light-blue citrate tube filled to the mark (usually for plasma). Invert gently 3–4 times. Deliver to the lab within the advised window — coagulation samples are time-sensitive.",
      accent: "blue",
    };
  }

  if (s.includes("fluoride") || s.includes("glucose") || s.includes("grey") || s.includes("gray")) {
    return {
      tubeLabel: "Grey top (fluoride)",
      tip: "Use a grey-top fluoride tube for glucose when specified. Invert gently and deliver promptly; note fasting status on the request form.",
      accent: "grey",
    };
  }

  if (s.includes("heparin") || (s.includes("plasma") && !s.includes("citrate") && !s.includes("edta"))) {
    return {
      tubeLabel: "Green top (heparin plasma) or as advised",
      tip: "Collect plasma in the tube advised for this test (often heparin). Invert gently, keep upright, and deliver promptly.",
      accent: "green",
    };
  }

  if (s.includes("serum") || s.includes("sst") || s.includes("clotted")) {
    return {
      tubeLabel: "Gold / SST or red top (serum)",
      tip: "Collect serum in a gold SST or plain red-top tube. Allow to clot, keep upright, and protect from extremes of heat. Separate serum only if your facility protocol requires it before courier.",
      accent: "gold",
    };
  }

  if (s.includes("plasma")) {
    return {
      tubeLabel: "Plasma tube (as advised)",
      tip: "Collect plasma in the correct anticoagulant tube for this test. Invert gently, keep upright, and deliver promptly — do not freeze unless instructed.",
      accent: "green",
    };
  }

  if (s.includes("urine")) {
    return {
      tubeLabel: "Sterile urine container",
      tip: "Use a clean, leak-proof sterile urine pot with a secure screw cap. Label the container (not only the lid). Deliver within 2 hours or refrigerate if delayed — do not freeze unless instructed.",
      accent: "green",
    };
  }

  if (s.includes("swab") || s.includes("culture") || s.includes("sputum") || s.includes("stool")) {
    return {
      tubeLabel: "Sterile collection kit",
      tip: "Use the sterile swab, stool or sputum container supplied for the test. Cap tightly, bag separately from paperwork, and deliver the same day when possible.",
      accent: "green",
    };
  }

  if (
    s.includes("tissue") ||
    s.includes("biopsy") ||
    s.includes("formalin") ||
    s.includes("histo") ||
    s.includes("cytolog") ||
    s.includes("pap")
  ) {
    return {
      tubeLabel: "Histopathology / cytology pot",
      tip: "Place tissue in the correct fixative pot (usually formalin) filled enough to cover the specimen. Label pot and request form; do not freeze formalin samples. Cytology fluids need leak-proof pots and prompt delivery.",
      accent: "neutral",
    };
  }

  return DEFAULT_TIP;
}

/**
 * Sample = specimen material brought to the lab.
 * (Not the preparation — that belongs in Sample type.)
 */
export const samples = [
  "Blood",
  "Urine",
  "Swab",
  "Stool",
  "Sputum",
  "Tissue / biopsy",
  "Body fluid",
  "Other / not sure",
] as const;

export type Sample = (typeof samples)[number];

/**
 * Sample type = how the specimen is prepared / which fraction is required.
 * e.g. Whole blood, Plasma, Serum — not the same as Sample.
 */
export const sampleTypesBySample: Record<Sample, readonly string[]> = {
  Blood: [
    "Whole blood",
    "EDTA whole blood",
    "Capillary whole blood",
    "Plasma",
    "EDTA plasma",
    "Citrate plasma",
    "Heparin plasma",
    "Serum",
    "Serum (fasting preferred)",
    "Serum / plasma",
  ],
  Urine: ["Mid-stream urine", "Catheter urine", "24-hour urine", "Urine (as advised)"],
  Swab: ["Sterile swab", "Throat swab", "Wound swab", "High vaginal swab"],
  Stool: ["Stool sample", "Stool in transport medium"],
  Sputum: ["Sputum", "Induced sputum"],
  "Tissue / biopsy": ["Tissue in formalin", "Fresh tissue", "Cytology smear", "PAP smear"],
  "Body fluid": ["CSF", "Pleural fluid", "Ascitic fluid", "Synovial fluid", "Other fluid"],
  "Other / not sure": ["As advised by lab"],
};

export const commonSampleTypes = Array.from(
  new Set(Object.values(sampleTypesBySample).flat()),
) as string[];

export function sampleFromSampleType(sampleType: string | null | undefined): Sample {
  const s = (sampleType ?? "").toLowerCase();
  if (!s.trim()) return "Other / not sure";
  if (s.includes("urine")) return "Urine";
  if (s.includes("swab")) return "Swab";
  if (s.includes("stool") || s.includes("faeces") || s.includes("feces")) return "Stool";
  if (s.includes("sputum")) return "Sputum";
  if (
    s.includes("tissue") ||
    s.includes("biopsy") ||
    s.includes("formalin") ||
    s.includes("histo") ||
    s.includes("cytolog") ||
    s.includes("pap")
  ) {
    return "Tissue / biopsy";
  }
  if (
    s.includes("csf") ||
    s.includes("pleural") ||
    s.includes("ascitic") ||
    s.includes("synovial") ||
    s.includes("fluid")
  ) {
    return "Body fluid";
  }
  if (
    s.includes("blood") ||
    s.includes("plasma") ||
    s.includes("serum") ||
    s.includes("edta") ||
    s.includes("citrate") ||
    s.includes("heparin") ||
    s.includes("capillary") ||
    s.includes("sst")
  ) {
    return "Blood";
  }
  return "Other / not sure";
}

/** @deprecated use sampleFromSampleType — kept for older call sites */
export const sampleClassFromSampleType = sampleFromSampleType;
/** @deprecated use `samples` */
export const sampleClasses = samples;

export function sampleTypesForSample(sample: string): string[] {
  if ((samples as readonly string[]).includes(sample)) {
    return [...sampleTypesBySample[sample as Sample]];
  }
  return [...commonSampleTypes, "As advised by lab"];
}

/** Guidance for clinics, hospitals and patients bringing samples. */
export const sampleDeliveryChecklist = [
  {
    title: "Label every primary tube",
    body: "Patient full name, age or DOB, sex, collection date/time, and requesting clinician or facility on the tube — not only on the form.",
  },
  {
    title: "Correct tube / container",
    body: "Match the stopper colour to the test (e.g. purple EDTA for whole blood). Under-filled or wrong tubes are often rejected.",
  },
  {
    title: "Pack samples safely",
    body: "Use a leak-proof tube, seal it in a bag with absorbent material, and keep request forms dry in a separate pouch. Couriers should use a rigid outer box.",
  },
  {
    title: "Temperature & time",
    body: "Most routine chemistry and haematology travel at room temperature. Coagulation and some microbiology samples are time-critical — deliver promptly. Never freeze whole blood unless we ask you to.",
  },
  {
    title: "Keep it safe",
    body: "No needles or sharps in the package. Wipe tubes dry before bagging. Tell our reception team if the sample needs special handling.",
  },
] as const;

export const packagingAccentClass: Record<PackagingTip["accent"], string> = {
  purple: "border-violet-500/40 bg-violet-500/10 text-violet-950",
  gold: "border-amber-500/40 bg-amber-500/10 text-amber-950",
  blue: "border-sky-500/40 bg-sky-500/10 text-sky-950",
  grey: "border-slate-400/50 bg-slate-500/10 text-slate-900",
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-950",
  neutral: "border-border bg-muted text-foreground",
};
