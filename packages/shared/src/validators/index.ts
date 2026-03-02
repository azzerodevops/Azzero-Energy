import { z } from "zod";

// ============================================================
// AzzeroCO2 Energy - Zod Validation Schemas
// ============================================================

// --- Phase 2: Domain Entity Validators ---
export * from "./sites";
export * from "./analyses";
export * from "./demands";
export * from "./resources";
export * from "./technologies";
export * from "./storage";
export * from "./lighting";
export * from "./files";
export * from "./scenarios";
export * from "./wizard";

// --- Organization ---

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  plan: z.enum(["free", "pro", "enterprise"]),
  createdAt: z.coerce.date(),
});

export const createOrganizationSchema = organizationSchema.omit({
  id: true,
  createdAt: true,
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type OrganizationInput = z.infer<typeof createOrganizationSchema>;
export type OrganizationRecord = z.infer<typeof organizationSchema>;

// --- User ---

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).max(255),
  role: z.enum(["admin", "analyst", "viewer"]),
  organizationId: z.string().uuid(),
  createdAt: z.coerce.date(),
});

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
});

export const updateUserSchema = createUserSchema.partial();

export type UserInput = z.infer<typeof createUserSchema>;
export type UserRecord = z.infer<typeof userSchema>;

// --- Energy Analysis ---

export const energyAnalysisSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: z.enum(["draft", "ready", "calculated"]),
  naceCode: z.string().min(1).max(10),
  annualConsumptionKwh: z.number().nonnegative(),
  co2EmissionsTons: z.number().nonnegative(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createEnergyAnalysisSchema = energyAnalysisSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  co2EmissionsTons: true,
});

export const updateEnergyAnalysisSchema = createEnergyAnalysisSchema.partial();

export type EnergyAnalysisInput = z.infer<typeof createEnergyAnalysisSchema>;
export type EnergyAnalysisRecord = z.infer<typeof energyAnalysisSchema>;

// --- Optimization Result ---

export const optimizationResultSchema = z.object({
  id: z.string().uuid(),
  analysisId: z.string().uuid(),
  savingsPercentage: z.number().min(0).max(100),
  paybackYears: z.number().nonnegative(),
  recommendedActions: z.array(z.string()),
  createdAt: z.coerce.date(),
});

export const createOptimizationResultSchema = optimizationResultSchema.omit({
  id: true,
  createdAt: true,
});

export type OptimizationResultInput = z.infer<typeof createOptimizationResultSchema>;
export type OptimizationResultRecord = z.infer<typeof optimizationResultSchema>;

// --- Audit Log ---

export const auditLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.string().min(1).max(100),
  resource: z.string().min(1).max(100),
  resourceId: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.coerce.date(),
});

export const createAuditLogSchema = auditLogSchema.omit({
  id: true,
  createdAt: true,
});

export type AuditLogInput = z.infer<typeof createAuditLogSchema>;
export type AuditLogRecord = z.infer<typeof auditLogSchema>;
