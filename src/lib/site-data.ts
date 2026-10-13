import {
  Activity,
  Baby,
  Bone,
  Brain,
  Eye,
  HeartPulse,
  Microscope,
  Scan,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from "lucide-react";

export const site = {
  name: "AKILI LABS",
  short: "AKILI",
  tagline: "Clinical Testing & Lab Supply",
  positioning: "Diagnostics · Equipment · Support",
  phone: "+260 211 000 000",
  whatsapp: "260974617682",
  email: "kangpethias@gmail.com",
  address: "Lusaka, Zambia  |  serving Central & East Africa",
  hours: "Clinic & sales Mon-Fri 08:00-18:00  |  Sat 09:00-13:00",
};

export type Department = {
  slug: string;
  name: string;
  icon: LucideIcon;
  summary: string;
  highlights: string[];
  skuCount: number;
};

/** Product lines we distribute to clinics, hospitals and laboratories. */
export const departments: Department[] = [
  {
    slug: "cardiology",
    name: "Cardiac Equipment",
    icon: HeartPulse,
    summary:
      "ECG systems, defibrillators, monitors and cath-lab consumables distributed to hospital cardiac units.",
    highlights: ["ECG & Holter", "Defibrillators", "Cath-lab supplies"],
    skuCount: 18,
  },
  {
    slug: "neurosciences",
    name: "Neuro & Critical Care Devices",
    icon: Brain,
    summary:
      "Neuromonitoring devices, ICU ventilators and specialty instruments for hospital critical-care departments.",
    highlights: ["Ventilators", "Neuromonitoring", "ICU accessories"],
    skuCount: 14,
  },
  {
    slug: "orthopaedics",
    name: "Surgical & Ortho Instruments",
    icon: Bone,
    summary: "Orthopaedic instrument sets, power tools and sterile surgical packs for theatre procurement.",
    highlights: ["Instrument trays", "Power tools", "Implant accessories"],
    skuCount: 16,
  },
  {
    slug: "oncology",
    name: "Oncology Support Systems",
    icon: Activity,
    summary: "Infusion pumps, biosafety cabinets and pharmacy prep equipment for cancer centres.",
    highlights: ["Infusion pumps", "Biosafety cabinets", "Pharmacy prep"],
    skuCount: 12,
  },
  {
    slug: "womens-health",
    name: "Maternity & Neonatal Equipment",
    icon: Baby,
    summary: "Fetal monitors, incubators, phototherapy units and obstetric delivery equipment for maternity wards.",
    highlights: ["Fetal monitors", "Incubators", "Delivery beds"],
    skuCount: 21,
  },
  {
    slug: "internal-medicine",
    name: "Clinic & Ward Devices",
    icon: Stethoscope,
    summary: "Vital-signs monitors, examination couches, diagnostic kits and clinic-ready devices for facility fit-outs.",
    highlights: ["Vital signs", "Exam furniture", "Point-of-care kits"],
    skuCount: 24,
  },
  {
    slug: "ophthalmology",
    name: "Ophthalmic Equipment",
    icon: Eye,
    summary: "Slit lamps, refractometers, surgical microscopes and ophthalmic diagnostic systems for eye clinics.",
    highlights: ["Slit lamps", "Refraction units", "Surgical scopes"],
    skuCount: 9,
  },
  {
    slug: "radiology",
    name: "Imaging Systems",
    icon: Scan,
    summary: "Digital X-ray, ultrasound, CT accessories and imaging workstation solutions for radiology departments.",
    highlights: ["Digital X-ray", "Ultrasound", "PACS accessories"],
    skuCount: 11,
  },
];

/** Countries where AKILI LABS operates. */
export type CountryProfile = {
  slug: string;
  code: string;
  name: string;
  hub: string;
  focus: string;
  summary: string;
  cities: string[];
  highlights: { label: string; value: string }[];
  productLineSlugs: string[];
  labImage: "chemistry" | "haematology" | "molecular" | "histopathology";
  office: {
    name: string;
    role: string;
    address: string;
    hours: string;
    phone: string;
    email: string;
    whatsapp: string;
  };
  contacts: {
    name: string;
    role: string;
    phone: string;
    email: string;
  }[];
  services: string[];
};

export const countries: CountryProfile[] = [
  {
    slug: "zambia",
    code: "ZM",
    name: "Zambia",
    hub: "Lusaka",
    focus: "HQ, warehouse and laboratory demonstration suite",
    summary:
      "Our regional headquarters in Lusaka coordinates supply, warehousing, lab demonstrations and after-sales support across Central and East Africa.",
    cities: ["Lusaka", "Ndola", "Kitwe", "Livingstone"],
    highlights: [
      { label: "Role", value: "Regional HQ" },
      { label: "Coverage", value: "Nationwide" },
      { label: "Demo suite", value: "On site" },
      { label: "Warehouse", value: "Stocked" },
    ],
    productLineSlugs: [
      "cardiology",
      "internal-medicine",
      "radiology",
      "womens-health",
    ],
    labImage: "chemistry",
    office: {
      name: "AKILI LABS Lusaka Hub",
      role: "Headquarters  |  warehouse  |  demo suite",
      address: "Lusaka, Zambia",
      hours: "Mon-Fri 08:00-18:00  |  Sat 09:00-13:00",
      phone: "+260 211 000 000",
      email: "zambia@akililabs.example",
      whatsapp: "260974617682",
    },
    contacts: [
      {
        name: "Sales desk - Zambia",
        role: "Quotes, demos and new accounts",
        phone: "+260 211 000 000",
        email: "zambia@akililabs.example",
      },
      {
        name: "Service desk - Zambia",
        role: "Installation, parts and maintenance",
        phone: "+260 211 000 001",
        email: "service.zm@akililabs.example",
      },
    ],
    services: [
      "Lab analysers and fit-outs",
      "Clinical and imaging devices",
      "Warehouse stock and cold-chain reagents",
      "Installation, training and service contracts",
    ],
  },
  {
    slug: "malawi",
    code: "MW",
    name: "Malawi",
    hub: "Lilongwe",
    focus: "Hospital and clinic equipment supply",
    summary:
      "From Lilongwe we supply hospitals, district facilities and diagnostic labs with clinic devices, lab systems and consumables.",
    cities: ["Lilongwe", "Blantyre", "Mzuzu", "Zomba"],
    highlights: [
      { label: "Focus", value: "Hospitals & clinics" },
      { label: "Coverage", value: "Central & South" },
      { label: "Delivery", value: "Scheduled" },
      { label: "Support", value: "On-site" },
    ],
    productLineSlugs: ["internal-medicine", "womens-health", "cardiology"],
    labImage: "haematology",
    office: {
      name: "AKILI LABS Lilongwe",
      role: "Sales & delivery coordination",
      address: "Lilongwe, Malawi",
      hours: "Mon-Fri 08:00-17:00",
      phone: "+265 1 000 000",
      email: "malawi@akililabs.example",
      whatsapp: "265888000000",
    },
    contacts: [
      {
        name: "Sales desk - Malawi",
        role: "Quotes and facility programmes",
        phone: "+265 1 000 000",
        email: "malawi@akililabs.example",
      },
      {
        name: "Logistics - Malawi",
        role: "Delivery scheduling and site readiness",
        phone: "+265 1 000 001",
        email: "logistics.mw@akililabs.example",
      },
    ],
    services: [
      "Hospital and clinic equipment",
      "District laboratory upgrades",
      "Consumables and reagent supply",
      "On-site installation support",
    ],
  },
  {
    slug: "mozambique",
    code: "MZ",
    name: "Mozambique",
    hub: "Maputo",
    focus: "Lab systems and clinic devices",
    summary:
      "Our Maputo team supports private and public facilities with laboratory platforms, clinic devices and ongoing service.",
    cities: ["Maputo", "Beira", "Nampula", "Matola"],
    highlights: [
      { label: "Focus", value: "Lab systems" },
      { label: "Buyers", value: "Public & private" },
      { label: "Language", value: "PT / EN" },
      { label: "Service", value: "Field support" },
    ],
    productLineSlugs: ["internal-medicine", "radiology", "oncology"],
    labImage: "chemistry",
    office: {
      name: "AKILI LABS Maputo",
      role: "Equipment supply & support",
      address: "Maputo, Mozambique",
      hours: "Mon-Fri 08:00-17:00",
      phone: "+258 21 000 000",
      email: "mozambique@akililabs.example",
      whatsapp: "258840000000",
    },
    contacts: [
      {
        name: "Sales desk - Mozambique",
        role: "Quotes and product selection",
        phone: "+258 21 000 000",
        email: "mozambique@akililabs.example",
      },
      {
        name: "Technical support - Mozambique",
        role: "Commissioning and after-sales",
        phone: "+258 21 000 001",
        email: "support.mz@akililabs.example",
      },
    ],
    services: [
      "Laboratory systems",
      "Clinical devices",
      "Private hospital group supply",
      "Service and spare parts",
    ],
  },
  {
    slug: "tanzania",
    code: "TZ",
    name: "Tanzania",
    hub: "Dar es Salaam",
    focus: "Diagnostic platforms and consumables",
    summary:
      "Based in Dar es Salaam, we supply diagnostic platforms, histopathology and molecular equipment, plus recurring consumables.",
    cities: ["Dar es Salaam", "Arusha", "Mwanza", "Dodoma"],
    highlights: [
      { label: "Focus", value: "Diagnostics" },
      { label: "Strength", value: "Consumables" },
      { label: "Coverage", value: "Mainland" },
      { label: "Training", value: "Available" },
    ],
    productLineSlugs: ["radiology", "oncology", "internal-medicine"],
    labImage: "histopathology",
    office: {
      name: "AKILI LABS Dar es Salaam",
      role: "Lab systems & consumables",
      address: "Dar es Salaam, Tanzania",
      hours: "Mon-Fri 08:00-17:00",
      phone: "+255 22 000 000",
      email: "tanzania@akililabs.example",
      whatsapp: "255700000000",
    },
    contacts: [
      {
        name: "Sales desk - Tanzania",
        role: "Quotes and lab programmes",
        phone: "+255 22 000 000",
        email: "tanzania@akililabs.example",
      },
      {
        name: "Consumables desk - Tanzania",
        role: "Reagents, controls and repeat orders",
        phone: "+255 22 000 001",
        email: "consumables.tz@akililabs.example",
      },
    ],
    services: [
      "Diagnostic analysers",
      "Histopathology equipment",
      "Reagents and consumables",
      "Operator training",
    ],
  },
  {
    slug: "central-african-republic",
    code: "CF",
    name: "Central African Republic",
    hub: "Bangui",
    focus: "Essential medical equipment programmes",
    summary:
      "From Bangui we support essential medical equipment programmes for public facilities and partner-funded upgrades.",
    cities: ["Bangui", "BerbÃ©rati", "Bambari"],
    highlights: [
      { label: "Focus", value: "Essential kits" },
      { label: "Programmes", value: "Partner-funded" },
      { label: "Language", value: "FR / EN" },
      { label: "Logistics", value: "Field-ready" },
    ],
    productLineSlugs: ["internal-medicine", "womens-health", "neurosciences"],
    labImage: "haematology",
    office: {
      name: "AKILI LABS Bangui",
      role: "Essential equipment programmes",
      address: "Bangui, Central African Republic",
      hours: "Mon-Fri 08:00-16:00",
      phone: "+236 21 00 00 00",
      email: "car@akililabs.example",
      whatsapp: "23670000000",
    },
    contacts: [
      {
        name: "Programme desk - CAR",
        role: "Public-sector and partner programmes",
        phone: "+236 21 00 00 00",
        email: "car@akililabs.example",
      },
      {
        name: "Field coordination - CAR",
        role: "Delivery and installation logistics",
        phone: "+236 21 00 00 01",
        email: "field.cf@akililabs.example",
      },
    ],
    services: [
      "Essential clinic devices",
      "Laboratory basics and kits",
      "Ministry and partner programmes",
      "Field logistics support",
    ],
  },
  {
    slug: "kenya",
    code: "KE",
    name: "Kenya",
    hub: "Nairobi",
    focus: "Imaging, lab analysers and institutional supply",
    summary:
      "Our Nairobi office serves private clinics, imaging centres, teaching hospitals and institutional buyers with analysers and imaging systems.",
    cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
    highlights: [
      { label: "Focus", value: "Imaging & labs" },
      { label: "Buyers", value: "Private & academic" },
      { label: "Demos", value: "Showroom" },
      { label: "Coverage", value: "Nationwide" },
    ],
    productLineSlugs: ["radiology", "ophthalmology", "oncology", "cardiology"],
    labImage: "molecular",
    office: {
      name: "AKILI LABS Nairobi",
      role: "Imaging, analysers & institutions",
      address: "Nairobi, Kenya",
      hours: "Mon-Fri 08:00-18:00  |  Sat 09:00-13:00",
      phone: "+254 20 000 0000",
      email: "kenya@akililabs.example",
      whatsapp: "254700000000",
    },
    contacts: [
      {
        name: "Sales desk - Kenya",
        role: "Quotes, demos and institutional accounts",
        phone: "+254 20 000 0000",
        email: "kenya@akililabs.example",
      },
      {
        name: "Imaging desk - Kenya",
        role: "X-ray, ultrasound and accessories",
        phone: "+254 20 000 0001",
        email: "imaging.ke@akililabs.example",
      },
    ],
    services: [
      "Lab analysers and molecular systems",
      "Digital imaging solutions",
      "Private clinic equipment",
      "Teaching hospital lab supply",
    ],
  },
];

export function getCountryBySlug(slug: string) {
  return countries.find((country) => country.slug === slug);
}

/** Institutions and networks we supply (replace with your exact client names anytime). */
export const clients = [
  {
    name: "Maina Soko Military Hospital",
    country: "Zambia",
    countrySlug: "zambia",
    type: "Military hospital",
    featured: true,
  },
  {
    name: "University Teaching Hospital (UTH)",
    country: "Zambia",
    countrySlug: "zambia",
    type: "Referral hospital",
    featured: true,
  },
  {
    name: "Levy Mwanawasa University Teaching Hospital",
    country: "Zambia",
    countrySlug: "zambia",
    type: "Teaching hospital",
    featured: true,
  },
  {
    name: "Kamuzu Central Hospital",
    country: "Malawi",
    countrySlug: "malawi",
    type: "Referral hospital",
    featured: true,
  },
  {
    name: "Queen Elizabeth Central Hospital",
    country: "Malawi",
    countrySlug: "malawi",
    type: "Referral hospital",
    featured: true,
  },
  {
    name: "Maputo Central Hospital",
    country: "Mozambique",
    countrySlug: "mozambique",
    type: "Referral hospital",
    featured: true,
  },
  {
    name: "Private hospital group - Maputo",
    country: "Mozambique",
    countrySlug: "mozambique",
    type: "Private clinic / hospital",
    featured: true,
  },
  {
    name: "Muhimbili National Hospital",
    country: "Tanzania",
    countrySlug: "tanzania",
    type: "National referral hospital",
    featured: true,
  },
  {
    name: "Regional diagnostic centre network",
    country: "Tanzania",
    countrySlug: "tanzania",
    type: "Laboratory network",
    featured: true,
  },
  {
    name: "Bangui community hospital programmes",
    country: "Central African Republic",
    countrySlug: "central-african-republic",
    type: "Public sector programmes",
    featured: true,
  },
  {
    name: "Ministry-supported facility upgrades",
    country: "Central African Republic",
    countrySlug: "central-african-republic",
    type: "Public sector programmes",
    featured: true,
  },
  {
    name: "Kenyatta National Hospital partners",
    country: "Kenya",
    countrySlug: "kenya",
    type: "National referral hospital",
    featured: true,
  },
  {
    name: "Private clinic & imaging centres",
    country: "Kenya",
    countrySlug: "kenya",
    type: "Private clinic / hospital",
    featured: true,
  },
  {
    name: "University & teaching hospital labs",
    country: "Kenya",
    countrySlug: "kenya",
    type: "Academic medicine",
    featured: true,
  },
];

export function getClientsByCountrySlug(slug: string) {
  return clients.filter((client) => client.countrySlug === slug);
}

export function getFeaturedClientsByCountrySlug(slug: string) {
  return clients.filter((client) => client.countrySlug === slug && client.featured);
}

/** Lab environments we equip and showcase. */
export const labGallery = [
  {
    id: "chemistry",
    title: "Clinical chemistry",
    country: "Zambia",
    countrySlug: "zambia",
    caption: "Automated chemistry benches and sample handling for hospital laboratories.",
  },
  {
    id: "haematology",
    title: "Haematology",
    country: "Malawi",
    countrySlug: "malawi",
    caption: "Blood analysers and accession workflows for high-volume labs.",
  },
  {
    id: "molecular",
    title: "Molecular diagnostics",
    country: "Kenya",
    countrySlug: "kenya",
    caption: "PCR systems and controlled workspaces for molecular testing labs.",
  },
  {
    id: "histopathology",
    title: "Histopathology",
    country: "Tanzania",
    countrySlug: "tanzania",
    caption: "Tissue processing and microtomy setups for pathology departments.",
  },
] as const;

export function getLabsByCountrySlug(slug: string) {
  return labGallery.filter((lab) => lab.countrySlug === slug);
}

/** Re-exported lab catalogue (enriched product fields). */
export type { LabProduct as LabTest } from './catalog';
export {
  labCategories,
  labTests,
  getLabProductByCode,
  brands,
  getBrandBySlug,
  downloads,
  servicePlans,
  aboutPoints,
  clinicalServiceLines,
} from './catalog';

export const equipmentPackages = [
  {
    name: "Clinic Starter Kit",
    price: "4,900",
    for: "New clinics fitting out consultation rooms",
    includes: [
      "Vital-signs monitor and examination couch",
      "Basic diagnostic kit and pulse oximeter",
      "Sterilisation tray and PPE starter pack",
      "On-site setup guidance",
    ],
  },
  {
    name: "Hospital Lab Fit-Out",
    price: "48,900",
    for: "Hospitals and labs commissioning or upgrading analysers",
    includes: [
      "Core analyser pair (haematology + chemistry)",
      "Centrifuges, cold storage and sample handling",
      "Installation, IQ/OQ and staff training",
      "12-month parts and service support",
      "Dedicated account manager",
    ],
    featured: true,
  },
  {
    name: "Imaging Ready Pack",
    price: "29,500",
    for: "Facilities adding digital imaging capacity",
    includes: [
      "Digital X-ray or mid-range ultrasound option",
      "Workstation and viewing accessories",
      "Protective lead apparel set",
      "Commissioning checklist and handover",
    ],
  },
];

export const locations = [
  {
    name: "Zambia - Lusaka Hub",
    type: "HQ  |  warehouse  |  lab demo suite",
    address: "Lusaka, Zambia",
    hours: "Mon-Fri 08:00-18:00  |  Sat 09:00-13:00",
  },
  {
    name: "Malawi - Lilongwe",
    type: "Sales & delivery coordination",
    address: "Lilongwe, Malawi",
    hours: "Mon-Fri 08:00-17:00",
  },
  {
    name: "Mozambique - Maputo",
    type: "Equipment supply & support",
    address: "Maputo, Mozambique",
    hours: "Mon-Fri 08:00-17:00",
  },
  {
    name: "Tanzania - Dar es Salaam",
    type: "Lab systems & consumables",
    address: "Dar es Salaam, Tanzania",
    hours: "Mon-Fri 08:00-17:00",
  },
  {
    name: "Central African Republic - Bangui",
    type: "Essential equipment programmes",
    address: "Bangui, CAR",
    hours: "Mon-Fri 08:00-16:00",
  },
  {
    name: "Kenya - Nairobi",
    type: "Imaging, analysers & institutions",
    address: "Nairobi, Kenya",
    hours: "Mon-Fri 08:00-18:00  |  Sat 09:00-13:00",
  },
];

export const faqs = [
  {
    q: "What does AKILI LABS do?",
    a: "We are a distribution company. We supply and deliver laboratory equipment, medical devices and consumables to clinics, hospitals and diagnostic laboratories.",
  },
  {
    q: "Where does AKILI LABS operate?",
    a: "We distribute across Zambia, Malawi, Mozambique, Tanzania, the Central African Republic and Kenya, with coordination hubs in each market.",
  },
  {
    q: "Do you run hospitals or offer medical treatment?",
    a: "No. We are a distribution company. We supply equipment and consumables to clinics, hospitals and labs - we do not treat patients or run clinical services.",
  },
  {
    q: "Who can buy from AKILI LABS?",
    a: "Clinics, hospitals, diagnostic laboratories, research facilities and authorised partners. Contact sales for account setup and quotation.",
  },
  {
    q: "Do you install and train on equipment?",
    a: "Yes. Most capital equipment includes installation options, operator training and IQ/OQ documentation. Service contracts are available after handover.",
  },
  {
    q: "What are typical lead times?",
    a: "Stock items ship within days. Imported analysers and imaging systems usually take 2-8 weeks depending on model and configuration.",
  },
  {
    q: "Can you supply reagents and consumables?",
    a: "Yes. We stock reagents, controls, calibrators and consumables matched to the platforms we distribute, with recurring delivery options.",
  },
  {
    q: "How do I request a quote?",
    a: "Use the online quote form, WhatsApp or email sales. Include the product line, quantity and delivery site so we can respond with pricing and lead times.",
  },
];

export const announcements = [
  "Walk-in and referral laboratory testing available at our Lusaka hub.",
  "2026 histopathology and cytology cash schedule now published.",
  "Hospital lab fit-outs include install, training and 12-month support.",
];

export const enterpriseCapabilities = [
  {
    title: "Multi-site procurement",
    body: "Standardised catalogues, volume pricing and coordinated deliveries for hospital groups and lab networks.",
    icon: Microscope,
  },
  {
    title: "Install, validate & train",
    body: "Commissioning, IQ/OQ support and operator training so equipment is ready for accredited laboratory use.",
    icon: Activity,
  },
  {
    title: "Service & spare parts",
    body: "Preventive maintenance plans, calibrated spares and responsive field engineers for uptime-critical devices.",
    icon: Syringe,
  },
];
