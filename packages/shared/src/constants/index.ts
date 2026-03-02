// ============================================================
// AzzeroCO2 Energy - Shared Constants
// ============================================================

export const BRAND_COLORS = {
  primary: "#0097D7",
  secondary: "#00B894",
  accent: "#6C5CE7",
  warning: "#FDCB6E",
  error: "#FF6B6B",
  dark: "#121827",
  darkCard: "#1E293B",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
} as const;

export const APP_NAME = "AzzeroCO2 Energy" as const;

export const APP_DESCRIPTION = "Il clima nelle nostre mani" as const;

export const NACE_SECTORS = [
  { code: "A", label: "Agriculture, forestry and fishing" },
  { code: "B", label: "Mining and quarrying" },
  { code: "C", label: "Manufacturing" },
  { code: "D", label: "Electricity, gas, steam and air conditioning supply" },
  { code: "E", label: "Water supply, sewerage, waste management and remediation" },
  { code: "F", label: "Construction" },
  { code: "H", label: "Transportation and storage" },
  { code: "J", label: "Information and communication" },
] as const;

export type NaceSectorCode = (typeof NACE_SECTORS)[number]["code"];

// --- Phase 2: Domain Labels (Italian) ---

export const END_USE_LABELS = {
  ELECTRICITY: "Elettricità",
  HEAT_HIGH_T: "Calore alta temperatura",
  HEAT_MED_T: "Calore media temperatura",
  HEAT_LOW_T: "Calore bassa temperatura",
  COLD: "Freddo",
} as const;

export const RESOURCE_TYPE_LABELS = {
  electricity: "Elettricità (rete)",
  natural_gas: "Gas naturale",
  biomass: "Biomassa",
  diesel: "Gasolio",
  lpg: "GPL",
  solar: "Solare",
  wind: "Eolico",
  hydrogen: "Idrogeno",
} as const;

export const STORAGE_TYPE_LABELS = {
  battery_lion: "Batteria Li-ion",
  thermal_hot: "Accumulo termico caldo",
  thermal_cold: "Accumulo termico freddo",
} as const;

export const ANALYSIS_STATUS_LABELS = {
  draft: "Bozza",
  ready: "Pronto",
  calculated: "Calcolato",
} as const;

export const ANALYSIS_STATUS_COLORS = {
  draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  ready: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  calculated: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
} as const;

export const FIXTURE_TYPES = [
  "Fluorescente",
  "Alogena",
  "HID",
  "LED",
  "Incandescente",
] as const;

export const CHART_COLORS = [
  "#0097D7", // primary blue
  "#00B894", // secondary green
  "#6C5CE7", // accent purple
  "#FFB020", // amber
  "#E17055", // coral
] as const;

export const SCENARIO_STATUS_LABELS = {
  draft: "Bozza",
  queued: "In coda",
  running: "In calcolo",
  completed: "Completato",
  failed: "Errore",
  outdated: "Obsoleto",
} as const;

export const SCENARIO_STATUS_COLORS = {
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  queued: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  running: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  outdated: "bg-orange-500/10 text-orange-500 border-orange-500/20",
} as const;

export const OBJECTIVE_LABELS = {
  cost: "Minimizzazione costi",
  decarbonization: "Decarbonizzazione",
} as const;

export const OBJECTIVE_COLORS = {
  cost: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  decarbonization: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
} as const;

// --- Phase 8.1: Demand Profile Types ---

export const PROFILE_TYPE_LABELS = {
  nace_default: "Default NACE",
  custom: "Personalizzato",
  upload: "Caricato",
  office: "Ufficio",
  industrial_1shift: "Industriale 1 turno",
  industrial_2shift: "Industriale 2 turni",
  industrial_3shift: "Industriale 3 turni (24/7)",
  commercial: "Commerciale",
  residential: "Residenziale",
  flat: "Costante",
} as const;

/** Default profile type by end-use (matches Python generator defaults) */
export const DEFAULT_PROFILE_TYPE_BY_END_USE: Record<string, keyof typeof PROFILE_TYPE_LABELS> = {
  ELECTRICITY: "office",
  HEAT_HIGH_T: "industrial_1shift",
  HEAT_MED_T: "industrial_1shift",
  HEAT_LOW_T: "office",
  COLD: "office",
} as const;

// --- Phase 5: Wizard Step Labels ---

export const WIZARD_STEPS = [
  { number: 1, label: "Dati generali", description: "Nome, sito, anno" },
  { number: 2, label: "Consumi energetici", description: "Elettricità e combustibili" },
  { number: 3, label: "Dettagli termici", description: "Illuminazione e zone" },
  { number: 4, label: "Tecnologie", description: "Selezione impianti" },
  { number: 5, label: "Riepilogo", description: "Verifica e lancio" },
] as const;

export type WizardStepNumber = (typeof WIZARD_STEPS)[number]["number"];

// --- Phase 8: NACE Energy Profiles ---
export {
  NACE_SECTION_LABELS,
  NACE_ENERGY_PROFILES,
  getNaceProfile,
  type NaceEnergyProfile,
} from "./nace-profiles";
