import { relations } from "drizzle-orm";

// --- Import all tables ---
import { organizations, users, userOrganizations } from "./organizations";
import { sites } from "./sites";
import { analyses } from "./analyses";
import { demands, lightingZones } from "./demands";
import { analysisResources } from "./resources";
import {
  technologyCatalog,
  techInputs,
  techOutputs,
  analysisTechnologies,
} from "./technologies";
import { storageSystems } from "./storage";
import {
  scenarios,
  scenarioTechConfigs,
  scenarioResults,
  techResults,
} from "./scenarios";
import { timeSeries } from "./time-series";
import { reports, files } from "./reports";
import { auditLogs } from "./audit-logs";
import { subscriptions } from "./subscriptions";

// ============================================================
// Organizations
// ============================================================

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  userOrganizations: many(userOrganizations),
  sites: many(sites),
  analyses: many(analyses),
  technologyCatalog: many(technologyCatalog),
  files: many(files),
  auditLogs: many(auditLogs),
  subscription: one(subscriptions),
}));

// ============================================================
// Users
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  userOrganizations: many(userOrganizations),
  createdAnalyses: many(analyses),
  createdScenarios: many(scenarios),
  generatedReports: many(reports),
  uploadedFiles: many(files),
  auditLogs: many(auditLogs),
}));

// ============================================================
// User <-> Organization (join table)
// ============================================================

export const userOrganizationsRelations = relations(
  userOrganizations,
  ({ one }) => ({
    user: one(users, {
      fields: [userOrganizations.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [userOrganizations.organizationId],
      references: [organizations.id],
    }),
  })
);

// ============================================================
// Sites
// ============================================================

export const sitesRelations = relations(sites, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sites.organizationId],
    references: [organizations.id],
  }),
  analyses: many(analyses),
}));

// ============================================================
// Analyses
// ============================================================

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  site: one(sites, {
    fields: [analyses.siteId],
    references: [sites.id],
  }),
  organization: one(organizations, {
    fields: [analyses.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [analyses.createdBy],
    references: [users.id],
  }),
  demands: many(demands),
  lightingZones: many(lightingZones),
  resources: many(analysisResources),
  technologies: many(analysisTechnologies),
  storageSystems: many(storageSystems),
  scenarios: many(scenarios),
  timeSeries: many(timeSeries),
  reports: many(reports),
  files: many(files),
}));

// ============================================================
// Demands
// ============================================================

export const demandsRelations = relations(demands, ({ one }) => ({
  analysis: one(analyses, {
    fields: [demands.analysisId],
    references: [analyses.id],
  }),
}));

export const lightingZonesRelations = relations(lightingZones, ({ one }) => ({
  analysis: one(analyses, {
    fields: [lightingZones.analysisId],
    references: [analyses.id],
  }),
}));

// ============================================================
// Resources
// ============================================================

export const analysisResourcesRelations = relations(
  analysisResources,
  ({ one }) => ({
    analysis: one(analyses, {
      fields: [analysisResources.analysisId],
      references: [analyses.id],
    }),
  })
);

// ============================================================
// Technology Catalog
// ============================================================

export const technologyCatalogRelations = relations(
  technologyCatalog,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [technologyCatalog.organizationId],
      references: [organizations.id],
    }),
    inputs: many(techInputs),
    outputs: many(techOutputs),
    analysisTechnologies: many(analysisTechnologies),
    scenarioTechConfigs: many(scenarioTechConfigs),
    techResults: many(techResults),
  })
);

export const techInputsRelations = relations(techInputs, ({ one }) => ({
  technology: one(technologyCatalog, {
    fields: [techInputs.technologyId],
    references: [technologyCatalog.id],
  }),
}));

export const techOutputsRelations = relations(techOutputs, ({ one }) => ({
  technology: one(technologyCatalog, {
    fields: [techOutputs.technologyId],
    references: [technologyCatalog.id],
  }),
}));

export const analysisTechnologiesRelations = relations(
  analysisTechnologies,
  ({ one }) => ({
    analysis: one(analyses, {
      fields: [analysisTechnologies.analysisId],
      references: [analyses.id],
    }),
    technology: one(technologyCatalog, {
      fields: [analysisTechnologies.technologyId],
      references: [technologyCatalog.id],
    }),
  })
);

// ============================================================
// Storage Systems
// ============================================================

export const storageSystemsRelations = relations(
  storageSystems,
  ({ one }) => ({
    analysis: one(analyses, {
      fields: [storageSystems.analysisId],
      references: [analyses.id],
    }),
  })
);

// ============================================================
// Scenarios
// ============================================================

export const scenariosRelations = relations(scenarios, ({ one, many }) => ({
  analysis: one(analyses, {
    fields: [scenarios.analysisId],
    references: [analyses.id],
  }),
  creator: one(users, {
    fields: [scenarios.createdBy],
    references: [users.id],
  }),
  techConfigs: many(scenarioTechConfigs),
  result: one(scenarioResults),
  reports: many(reports),
}));

export const scenarioTechConfigsRelations = relations(
  scenarioTechConfigs,
  ({ one }) => ({
    scenario: one(scenarios, {
      fields: [scenarioTechConfigs.scenarioId],
      references: [scenarios.id],
    }),
    technology: one(technologyCatalog, {
      fields: [scenarioTechConfigs.technologyId],
      references: [technologyCatalog.id],
    }),
  })
);

export const scenarioResultsRelations = relations(
  scenarioResults,
  ({ one, many }) => ({
    scenario: one(scenarios, {
      fields: [scenarioResults.scenarioId],
      references: [scenarios.id],
    }),
    techResults: many(techResults),
  })
);

export const techResultsRelations = relations(techResults, ({ one }) => ({
  scenarioResult: one(scenarioResults, {
    fields: [techResults.scenarioResultId],
    references: [scenarioResults.id],
  }),
  technology: one(technologyCatalog, {
    fields: [techResults.technologyId],
    references: [technologyCatalog.id],
  }),
}));

// ============================================================
// Time Series
// ============================================================

export const timeSeriesRelations = relations(timeSeries, ({ one }) => ({
  analysis: one(analyses, {
    fields: [timeSeries.analysisId],
    references: [analyses.id],
  }),
}));

// ============================================================
// Reports
// ============================================================

export const reportsRelations = relations(reports, ({ one }) => ({
  analysis: one(analyses, {
    fields: [reports.analysisId],
    references: [analyses.id],
  }),
  scenario: one(scenarios, {
    fields: [reports.scenarioId],
    references: [scenarios.id],
  }),
  generatedByUser: one(users, {
    fields: [reports.generatedBy],
    references: [users.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  organization: one(organizations, {
    fields: [files.organizationId],
    references: [organizations.id],
  }),
  analysis: one(analyses, {
    fields: [files.analysisId],
    references: [analyses.id],
  }),
  uploadedByUser: one(users, {
    fields: [files.uploadedBy],
    references: [users.id],
  }),
}));

// ============================================================
// Audit Logs
// ============================================================

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// ============================================================
// Subscriptions
// ============================================================

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
}));
