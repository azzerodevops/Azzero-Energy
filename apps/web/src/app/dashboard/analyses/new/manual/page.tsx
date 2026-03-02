import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/context";
import { redirect } from "next/navigation";
import { AnalysisForm } from "@/components/analyses/analysis-form";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Nuova analisi — Creazione manuale" };
export const dynamic = "force-dynamic";

export default async function ManualNewAnalysisPage() {
  let context;
  try {
    context = await getAuthContext();
  } catch {
    redirect("/auth/login");
  }

  const orgId = context.currentOrganizationId;
  if (!orgId) redirect("/dashboard");

  const supabase = await createClient();

  // Get sites for the selector
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, city")
    .eq("organization_id", orgId)
    .order("name");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="space-y-1">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/dashboard/analyses" className="hover:text-foreground">
            Analisi
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Nuova analisi</span>
        </nav>
        <h1 className="text-2xl font-bold">Creazione manuale</h1>
        <p className="text-muted-foreground">
          Crea un&apos;analisi e compila ogni sezione manualmente tramite le tab
        </p>
      </div>

      <AnalysisForm
        organizationId={orgId}
        sites={sites ?? []}
      />
    </div>
  );
}
