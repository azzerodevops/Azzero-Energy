import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { SitesTable } from "./sites-table";

export const metadata: Metadata = { title: "Siti" };
export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, city, nace_code, area_sqm, employees, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Impianti" description="Gestisci i tuoi siti e stabilimenti">
        <Button asChild>
          <Link href="/dashboard/sites/new">
            <Plus className="mr-2 h-4 w-4" /> Nuovo impianto
          </Link>
        </Button>
      </PageHeader>
      <SitesTable data={sites ?? []} />
    </div>
  );
}
