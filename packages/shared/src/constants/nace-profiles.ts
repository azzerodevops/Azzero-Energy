// ============================================================
// AzzeroCO2 Energy - NACE Energy Profiles
// Typical energy consumption patterns by NACE section/code
// Used for smart defaults in the analysis wizard
// ============================================================

export interface NaceEnergyProfile {
  sector: string;
  typical_kwh_per_sqm: number;
  typical_kwh_per_employee: number;
  electricity_pct: number; // fraction of total energy that is electricity
  gas_pct: number; // fraction of total energy that is gas/thermal
  typical_operating_hours: number;
  typical_working_days: string[];
}

/**
 * NACE_SECTION_LABELS maps each NACE section letter to an Italian sector name.
 * Used by the NaceSelector to auto-fill the "sector" field.
 */
export const NACE_SECTION_LABELS: Record<string, string> = {
  A: "Agricoltura, silvicoltura e pesca",
  B: "Estrazione di minerali",
  C: "Manifatturiero",
  D: "Fornitura di energia",
  E: "Acqua e gestione rifiuti",
  F: "Costruzioni",
  G: "Commercio",
  H: "Trasporti e magazzinaggio",
  I: "Alloggio e ristorazione",
  J: "Informazione e comunicazione",
  K: "Attività finanziarie",
  L: "Attività immobiliari",
  M: "Attività professionali",
  N: "Servizi amministrativi",
  O: "Pubblica amministrazione",
  P: "Istruzione",
  Q: "Sanità e assistenza sociale",
  R: "Arte, sport e intrattenimento",
  S: "Altri servizi",
};

/**
 * NACE_ENERGY_PROFILES provides typical energy consumption data per NACE code.
 * - Keys are NACE codes (e.g. "C10", "A01") matching the nace_codes DB table.
 * - Values include sector name (IT), kWh/m2, kWh/employee, energy split, hours, days.
 * - Sources: ENEA benchmarks, EU energy audit best practices, Italian GSE data.
 */
export const NACE_ENERGY_PROFILES: Record<string, NaceEnergyProfile> = {
  // === Section A - Agricoltura ===
  A01: {
    sector: "Agricoltura",
    typical_kwh_per_sqm: 50,
    typical_kwh_per_employee: 8000,
    electricity_pct: 0.35,
    gas_pct: 0.65,
    typical_operating_hours: 2500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  A02: {
    sector: "Silvicoltura",
    typical_kwh_per_sqm: 30,
    typical_kwh_per_employee: 5000,
    electricity_pct: 0.3,
    gas_pct: 0.7,
    typical_operating_hours: 2000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  A03: {
    sector: "Pesca e acquacoltura",
    typical_kwh_per_sqm: 80,
    typical_kwh_per_employee: 12000,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 3000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },

  // === Section B - Estrazione minerali ===
  B05: {
    sector: "Estrazione carbone",
    typical_kwh_per_sqm: 150,
    typical_kwh_per_employee: 25000,
    electricity_pct: 0.55,
    gas_pct: 0.45,
    typical_operating_hours: 5000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  B06: {
    sector: "Estrazione petrolio e gas",
    typical_kwh_per_sqm: 200,
    typical_kwh_per_employee: 30000,
    electricity_pct: 0.4,
    gas_pct: 0.6,
    typical_operating_hours: 7000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
  B08: {
    sector: "Estrazione minerali da cave",
    typical_kwh_per_sqm: 120,
    typical_kwh_per_employee: 18000,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 4000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section C - Manifatturiero ===
  C10: {
    sector: "Alimentare",
    typical_kwh_per_sqm: 280,
    typical_kwh_per_employee: 15000,
    electricity_pct: 0.4,
    gas_pct: 0.6,
    typical_operating_hours: 4000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C11: {
    sector: "Bevande",
    typical_kwh_per_sqm: 250,
    typical_kwh_per_employee: 18000,
    electricity_pct: 0.45,
    gas_pct: 0.55,
    typical_operating_hours: 3500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C13: {
    sector: "Tessile",
    typical_kwh_per_sqm: 200,
    typical_kwh_per_employee: 12000,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 4000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C14: {
    sector: "Abbigliamento",
    typical_kwh_per_sqm: 120,
    typical_kwh_per_employee: 6000,
    electricity_pct: 0.65,
    gas_pct: 0.35,
    typical_operating_hours: 2500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C15: {
    sector: "Articoli in pelle",
    typical_kwh_per_sqm: 140,
    typical_kwh_per_employee: 7000,
    electricity_pct: 0.6,
    gas_pct: 0.4,
    typical_operating_hours: 2500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C16: {
    sector: "Industria del legno",
    typical_kwh_per_sqm: 180,
    typical_kwh_per_employee: 10000,
    electricity_pct: 0.55,
    gas_pct: 0.45,
    typical_operating_hours: 3500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C17: {
    sector: "Carta",
    typical_kwh_per_sqm: 350,
    typical_kwh_per_employee: 25000,
    electricity_pct: 0.45,
    gas_pct: 0.55,
    typical_operating_hours: 5000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  C18: {
    sector: "Stampa",
    typical_kwh_per_sqm: 160,
    typical_kwh_per_employee: 8000,
    electricity_pct: 0.7,
    gas_pct: 0.3,
    typical_operating_hours: 3000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C19: {
    sector: "Raffinazione petrolio",
    typical_kwh_per_sqm: 500,
    typical_kwh_per_employee: 50000,
    electricity_pct: 0.3,
    gas_pct: 0.7,
    typical_operating_hours: 8000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
  C20: {
    sector: "Prodotti chimici",
    typical_kwh_per_sqm: 400,
    typical_kwh_per_employee: 35000,
    electricity_pct: 0.4,
    gas_pct: 0.6,
    typical_operating_hours: 6000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  C21: {
    sector: "Farmaceutico",
    typical_kwh_per_sqm: 300,
    typical_kwh_per_employee: 20000,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 5000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C22: {
    sector: "Gomma e plastica",
    typical_kwh_per_sqm: 320,
    typical_kwh_per_employee: 22000,
    electricity_pct: 0.6,
    gas_pct: 0.4,
    typical_operating_hours: 4500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  C23: {
    sector: "Minerali non metalliferi",
    typical_kwh_per_sqm: 450,
    typical_kwh_per_employee: 40000,
    electricity_pct: 0.35,
    gas_pct: 0.65,
    typical_operating_hours: 5500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  C24: {
    sector: "Metallurgia",
    typical_kwh_per_sqm: 600,
    typical_kwh_per_employee: 55000,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 6500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  C25: {
    sector: "Prodotti in metallo",
    typical_kwh_per_sqm: 250,
    typical_kwh_per_employee: 14000,
    electricity_pct: 0.55,
    gas_pct: 0.45,
    typical_operating_hours: 4000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C26: {
    sector: "Elettronica",
    typical_kwh_per_sqm: 220,
    typical_kwh_per_employee: 12000,
    electricity_pct: 0.8,
    gas_pct: 0.2,
    typical_operating_hours: 3500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C27: {
    sector: "Apparecchiature elettriche",
    typical_kwh_per_sqm: 200,
    typical_kwh_per_employee: 11000,
    electricity_pct: 0.7,
    gas_pct: 0.3,
    typical_operating_hours: 3500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C28: {
    sector: "Macchinari",
    typical_kwh_per_sqm: 230,
    typical_kwh_per_employee: 13000,
    electricity_pct: 0.6,
    gas_pct: 0.4,
    typical_operating_hours: 4000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C29: {
    sector: "Autoveicoli",
    typical_kwh_per_sqm: 350,
    typical_kwh_per_employee: 20000,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 5000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  C30: {
    sector: "Mezzi di trasporto",
    typical_kwh_per_sqm: 300,
    typical_kwh_per_employee: 18000,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 4500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C31: {
    sector: "Mobili",
    typical_kwh_per_sqm: 160,
    typical_kwh_per_employee: 8000,
    electricity_pct: 0.6,
    gas_pct: 0.4,
    typical_operating_hours: 3000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C32: {
    sector: "Altre manifatture",
    typical_kwh_per_sqm: 180,
    typical_kwh_per_employee: 10000,
    electricity_pct: 0.6,
    gas_pct: 0.4,
    typical_operating_hours: 3000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  C33: {
    sector: "Riparazione macchinari",
    typical_kwh_per_sqm: 150,
    typical_kwh_per_employee: 9000,
    electricity_pct: 0.65,
    gas_pct: 0.35,
    typical_operating_hours: 2500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section D - Fornitura energia ===
  D35: {
    sector: "Fornitura energia",
    typical_kwh_per_sqm: 400,
    typical_kwh_per_employee: 45000,
    electricity_pct: 0.6,
    gas_pct: 0.4,
    typical_operating_hours: 8000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },

  // === Section E - Acqua e rifiuti ===
  E36: {
    sector: "Trattamento acqua",
    typical_kwh_per_sqm: 180,
    typical_kwh_per_employee: 20000,
    electricity_pct: 0.85,
    gas_pct: 0.15,
    typical_operating_hours: 7000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
  E37: {
    sector: "Gestione fognature",
    typical_kwh_per_sqm: 160,
    typical_kwh_per_employee: 18000,
    electricity_pct: 0.8,
    gas_pct: 0.2,
    typical_operating_hours: 7000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
  E38: {
    sector: "Gestione rifiuti",
    typical_kwh_per_sqm: 200,
    typical_kwh_per_employee: 22000,
    electricity_pct: 0.6,
    gas_pct: 0.4,
    typical_operating_hours: 5000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },

  // === Section F - Costruzioni ===
  F41: {
    sector: "Costruzione edifici",
    typical_kwh_per_sqm: 80,
    typical_kwh_per_employee: 5000,
    electricity_pct: 0.45,
    gas_pct: 0.55,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  F42: {
    sector: "Ingegneria civile",
    typical_kwh_per_sqm: 90,
    typical_kwh_per_employee: 6000,
    electricity_pct: 0.4,
    gas_pct: 0.6,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  F43: {
    sector: "Lavori specializzati",
    typical_kwh_per_sqm: 100,
    typical_kwh_per_employee: 5500,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section G - Commercio ===
  G45: {
    sector: "Commercio autoveicoli",
    typical_kwh_per_sqm: 120,
    typical_kwh_per_employee: 7000,
    electricity_pct: 0.7,
    gas_pct: 0.3,
    typical_operating_hours: 2500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  G46: {
    sector: "Commercio all'ingrosso",
    typical_kwh_per_sqm: 100,
    typical_kwh_per_employee: 6000,
    electricity_pct: 0.65,
    gas_pct: 0.35,
    typical_operating_hours: 2500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  G47: {
    sector: "Commercio al dettaglio",
    typical_kwh_per_sqm: 150,
    typical_kwh_per_employee: 5000,
    electricity_pct: 0.75,
    gas_pct: 0.25,
    typical_operating_hours: 3000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },

  // === Section H - Trasporti ===
  H49: {
    sector: "Trasporto terrestre",
    typical_kwh_per_sqm: 60,
    typical_kwh_per_employee: 10000,
    electricity_pct: 0.3,
    gas_pct: 0.7,
    typical_operating_hours: 4000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  H50: {
    sector: "Trasporto marittimo",
    typical_kwh_per_sqm: 70,
    typical_kwh_per_employee: 15000,
    electricity_pct: 0.25,
    gas_pct: 0.75,
    typical_operating_hours: 5000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
  H51: {
    sector: "Trasporto aereo",
    typical_kwh_per_sqm: 100,
    typical_kwh_per_employee: 25000,
    electricity_pct: 0.2,
    gas_pct: 0.8,
    typical_operating_hours: 6000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
  H52: {
    sector: "Magazzinaggio",
    typical_kwh_per_sqm: 80,
    typical_kwh_per_employee: 8000,
    electricity_pct: 0.6,
    gas_pct: 0.4,
    typical_operating_hours: 4000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },

  // === Section I - Alloggio e ristorazione ===
  I55: {
    sector: "Alloggio",
    typical_kwh_per_sqm: 200,
    typical_kwh_per_employee: 10000,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 6000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
  I56: {
    sector: "Ristorazione",
    typical_kwh_per_sqm: 300,
    typical_kwh_per_employee: 12000,
    electricity_pct: 0.45,
    gas_pct: 0.55,
    typical_operating_hours: 3500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },

  // === Section J - ICT ===
  J61: {
    sector: "Telecomunicazioni",
    typical_kwh_per_sqm: 250,
    typical_kwh_per_employee: 10000,
    electricity_pct: 0.9,
    gas_pct: 0.1,
    typical_operating_hours: 8760,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
  J62: {
    sector: "Software e consulenza IT",
    typical_kwh_per_sqm: 100,
    typical_kwh_per_employee: 4000,
    electricity_pct: 0.9,
    gas_pct: 0.1,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  J63: {
    sector: "Servizi informativi",
    typical_kwh_per_sqm: 130,
    typical_kwh_per_employee: 5000,
    electricity_pct: 0.85,
    gas_pct: 0.15,
    typical_operating_hours: 2500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section K - Finanza ===
  K64: {
    sector: "Servizi finanziari",
    typical_kwh_per_sqm: 110,
    typical_kwh_per_employee: 4500,
    electricity_pct: 0.85,
    gas_pct: 0.15,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section L - Immobiliare ===
  L68: {
    sector: "Attività immobiliari",
    typical_kwh_per_sqm: 90,
    typical_kwh_per_employee: 4000,
    electricity_pct: 0.7,
    gas_pct: 0.3,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section M - Professionali ===
  M69: {
    sector: "Attività legali e contabili",
    typical_kwh_per_sqm: 90,
    typical_kwh_per_employee: 3500,
    electricity_pct: 0.85,
    gas_pct: 0.15,
    typical_operating_hours: 2000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  M70: {
    sector: "Consulenza gestionale",
    typical_kwh_per_sqm: 95,
    typical_kwh_per_employee: 3800,
    electricity_pct: 0.85,
    gas_pct: 0.15,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },
  M71: {
    sector: "Architettura e ingegneria",
    typical_kwh_per_sqm: 85,
    typical_kwh_per_employee: 3500,
    electricity_pct: 0.85,
    gas_pct: 0.15,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section N - Servizi amministrativi ===
  N77: {
    sector: "Noleggio e leasing",
    typical_kwh_per_sqm: 70,
    typical_kwh_per_employee: 3000,
    electricity_pct: 0.75,
    gas_pct: 0.25,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section O - Pubblica amministrazione ===
  O84: {
    sector: "Pubblica amministrazione",
    typical_kwh_per_sqm: 120,
    typical_kwh_per_employee: 5000,
    electricity_pct: 0.7,
    gas_pct: 0.3,
    typical_operating_hours: 2200,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section P - Istruzione ===
  P85: {
    sector: "Istruzione",
    typical_kwh_per_sqm: 110,
    typical_kwh_per_employee: 5000,
    electricity_pct: 0.45,
    gas_pct: 0.55,
    typical_operating_hours: 2000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven"],
  },

  // === Section Q - Sanità ===
  Q86: {
    sector: "Assistenza sanitaria",
    typical_kwh_per_sqm: 280,
    typical_kwh_per_employee: 15000,
    electricity_pct: 0.5,
    gas_pct: 0.5,
    typical_operating_hours: 6000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
  Q87: {
    sector: "Assistenza residenziale",
    typical_kwh_per_sqm: 220,
    typical_kwh_per_employee: 10000,
    electricity_pct: 0.45,
    gas_pct: 0.55,
    typical_operating_hours: 8760,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },

  // === Section R - Arte e sport ===
  R90: {
    sector: "Attività creative",
    typical_kwh_per_sqm: 100,
    typical_kwh_per_employee: 4000,
    electricity_pct: 0.8,
    gas_pct: 0.2,
    typical_operating_hours: 2000,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab"],
  },
  R93: {
    sector: "Sport e intrattenimento",
    typical_kwh_per_sqm: 180,
    typical_kwh_per_employee: 8000,
    electricity_pct: 0.7,
    gas_pct: 0.3,
    typical_operating_hours: 3500,
    typical_working_days: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],
  },
};

/**
 * Looks up an energy profile by NACE code.
 * Falls back to the first two characters (section + division) if exact match is not found.
 */
export function getNaceProfile(naceCode: string): NaceEnergyProfile | undefined {
  // Try exact match first
  if (NACE_ENERGY_PROFILES[naceCode]) {
    return NACE_ENERGY_PROFILES[naceCode];
  }
  // Try section + first two digits (e.g. "C10.1" -> "C10")
  const prefix = naceCode.slice(0, 3);
  if (NACE_ENERGY_PROFILES[prefix]) {
    return NACE_ENERGY_PROFILES[prefix];
  }
  return undefined;
}
