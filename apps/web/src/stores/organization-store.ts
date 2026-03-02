import { create } from "zustand";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string | null;
}

interface OrganizationState {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isAzzeroCO2Admin: boolean;
  setOrganization: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setIsAzzeroCO2Admin: (value: boolean) => void;
  clear: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  currentOrganization: null,
  organizations: [],
  isAzzeroCO2Admin: false,
  setOrganization: (org) => set({ currentOrganization: org }),
  setOrganizations: (orgs) =>
    set((state) => ({
      organizations: orgs,
      currentOrganization: state.currentOrganization ?? orgs[0] ?? null,
    })),
  setIsAzzeroCO2Admin: (value) => set({ isAzzeroCO2Admin: value }),
  clear: () =>
    set({
      currentOrganization: null,
      organizations: [],
      isAzzeroCO2Admin: false,
    }),
}));
