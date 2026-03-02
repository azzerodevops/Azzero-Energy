// ============================================================
// AzzeroCO2 Energy - Core Domain Types
// ============================================================

export type OrganizationPlan = "free" | "pro" | "enterprise";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  createdAt: Date;
}

export type UserRole = "admin" | "analyst" | "viewer";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  createdAt: Date;
}

export type AnalysisStatus = "draft" | "ready" | "calculated";

export interface EnergyAnalysis {
  id: string;
  organizationId: string;
  name: string;
  status: AnalysisStatus;
  naceCode: string;
  annualConsumptionKwh: number;
  co2EmissionsTons: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OptimizationResult {
  id: string;
  analysisId: string;
  savingsPercentage: number;
  paybackYears: number;
  recommendedActions: string[];
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
