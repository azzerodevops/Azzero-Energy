// ============================================================
// AzzeroCO2 Energy - Database Seed Script
// Seeds NACE codes and global technology catalog
// Run: pnpm db:seed
// ============================================================

import { db } from "../client";
import { naceCodes as naceCodesTable } from "../schema/nace-codes";
import { technologyCatalog, techInputs, techOutputs } from "../schema/technologies";
import { naceCodes } from "./data/nace-codes";
import { technologies } from "./data/technologies";

async function seed() {
  console.log("Seeding database...\n");

  // ---- Seed NACE codes ----
  console.log("  -> NACE codes...");
  await db
    .insert(naceCodesTable)
    .values(
      naceCodes.map((nc) => ({
        code: nc.code,
        description: nc.description,
        section: nc.section,
        isEnergyRelevant: nc.isEnergyRelevant,
      }))
    )
    .onConflictDoNothing();
  console.log(`     ${naceCodes.length} NACE codes inserted.`);

  // ---- Seed technology catalog ----
  console.log("  -> Technologies...");
  let techCount = 0;

  for (const tech of technologies) {
    const [inserted] = await db
      .insert(technologyCatalog)
      .values({
        name: tech.name,
        category: tech.category,
        description: tech.description,
        capexPerKw: String(tech.capexPerKw),
        maintenanceAnnualPerKw: String(tech.maintenanceAnnualPerKw),
        lifetime: tech.lifetime,
        capacityFactor: String(tech.capacityFactor),
        minSizeKw: String(tech.minSizeKw),
        maxSizeKw: String(tech.maxSizeKw),
        isGlobal: true,
        icon: tech.icon,
      })
      .returning();

    // Insert inputs
    if (tech.inputs && tech.inputs.length > 0) {
      for (const input of tech.inputs) {
        await db.insert(techInputs).values({
          technologyId: inserted.id,
          resourceType: input.resourceType as any,
          conversionFactor: String(input.conversionFactor),
        });
      }
    }

    // Insert outputs
    if (tech.outputs && tech.outputs.length > 0) {
      for (const output of tech.outputs) {
        await db.insert(techOutputs).values({
          technologyId: inserted.id,
          endUse: output.endUse as any,
          conversionFactor: String(output.conversionFactor),
        });
      }
    }

    techCount++;
    console.log(`     [${techCount}/${technologies.length}] ${tech.name}`);
  }

  console.log(`\nSeed complete! ${naceCodes.length} NACE codes + ${techCount} technologies inserted.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
