"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { getClientAuthContext } from "@/actions/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setLoading } = useAuthStore();
  const { setOrganizations, setOrganization, setIsAzzeroCO2Admin, clear } =
    useOrganizationStore();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadOrgContext() {
      const result = await getClientAuthContext();
      if (result.success) {
        const { organizations, currentOrganizationId, isAzzeroCO2Admin } =
          result.data;
        setOrganizations(organizations);
        setIsAzzeroCO2Admin(isAzzeroCO2Admin);

        // Set the current organization from the server-resolved value
        if (currentOrganizationId) {
          const currentOrg = organizations.find(
            (o) => o.id === currentOrganizationId,
          );
          if (currentOrg) {
            setOrganization(currentOrg);
          }
        }
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session);
      if (session?.user) {
        loadOrgContext();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setAuth(session?.user ?? null, session);

      if (session?.user) {
        loadOrgContext();
      } else {
        clear();
      }

      // Redirect to reset password page when a recovery link is used
      if (event === "PASSWORD_RECOVERY") {
        router.push("/auth/reset-password");
      }
    });

    return () => subscription.unsubscribe();
  }, [
    setAuth,
    setLoading,
    setOrganizations,
    setOrganization,
    setIsAzzeroCO2Admin,
    clear,
    router,
  ]);

  return <>{children}</>;
}
