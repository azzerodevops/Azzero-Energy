import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { PageHeader } from "@/components/shared/page-header";
import { SiteForm } from "@/components/sites/site-form";

export const dynamic = "force-dynamic";

export default async function NewSitePage() {
  let context;
  try {
    context = await getAuthContext();
  } catch {
    redirect("/auth/login");
  }

  if (!context.currentOrganizationId) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader title="Nuovo impianto" description="Aggiungi un nuovo sito o stabilimento" />
      <SiteForm organizationId={context.currentOrganizationId} />
    </div>
  );
}
