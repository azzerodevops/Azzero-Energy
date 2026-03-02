import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { SiteForm } from "@/components/sites/site-form";

export const dynamic = "force-dynamic";

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: site } = await supabase.from("sites").select("*").eq("id", id).single();
  if (!site) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Modifica impianto" description={site.name} />
      <SiteForm organizationId={site.organization_id} initialData={site} />
    </div>
  );
}
