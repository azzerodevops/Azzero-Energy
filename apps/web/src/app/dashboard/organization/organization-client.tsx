"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Users, Save, Crown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createBrowserClient } from "@supabase/ssr";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

interface OrganizationClientProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    created_at: string;
  };
  members: Array<{
    role: string;
    joinedAt: string;
    user: { id: string; email: string; full_name: string | null } | null;
  }>;
  currentUserRole: string;
}

export function OrganizationClient({ organization, members, currentUserRole }: OrganizationClientProps) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [saving, setSaving] = useState(false);
  const isAdmin = currentUserRole === "admin";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Il nome non può essere vuoto");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: name.trim() })
        .eq("id", organization.id);

      if (error) { toast.error(error.message); return; }
      toast.success("Organizzazione aggiornata");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const createdAt = new Date(organization.created_at).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizzazione</h1>
        <p className="text-muted-foreground">Gestisci le impostazioni della tua organizzazione</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info card */}
        <Card className="lg:col-span-1">
          <CardHeader className="items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-2">{organization.name}</CardTitle>
            <CardDescription>/{organization.slug}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Piano:</span>
              <Badge variant="secondary">{PLAN_LABELS[organization.plan] ?? organization.plan}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Membri:</span>
              <span>{members.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Creata:</span>
              <span>{createdAt}</span>
            </div>
          </CardContent>
        </Card>

        {/* Settings + Members */}
        <div className="space-y-6 lg:col-span-2">
          {/* Edit form */}
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni</CardTitle>
              <CardDescription>Modifica le informazioni dell&apos;organizzazione</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Nome organizzazione</Label>
                <Input
                  id="orgName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="La mia azienda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Slug</Label>
                <Input id="orgSlug" value={organization.slug} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Lo slug non può essere modificato</p>
              </div>
              {isAdmin && (
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvataggio..." : "Salva modifiche"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Members table */}
          <Card>
            <CardHeader>
              <CardTitle>Membri</CardTitle>
              <CardDescription>Utenti che fanno parte di questa organizzazione</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => {
                  if (!member.user) return null;
                  const joinedDate = new Date(member.joinedAt).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={member.user.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {member.user.full_name || member.user.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{joinedDate}</span>
                        <Badge variant="outline">{ROLE_LABELS[member.role] ?? member.role}</Badge>
                      </div>
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nessun membro trovato
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
