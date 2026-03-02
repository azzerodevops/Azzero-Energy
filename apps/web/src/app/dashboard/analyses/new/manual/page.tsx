import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalysisForm } from "@/components/analyses/analysis-form";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Nuova analisi — Creazione manuale" };
export const dynamic = "force-dynamic";

export default async function ManualNewAnalysisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get user's organization
  const { data: membership } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/dashboard");

  // Get sites for the selector
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, city")
    .eq("organization_id", membership.organization_id)
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
        organizationId={membership.organization_id}
        sites={sites ?? []}
      />
    </div>
  );
}
