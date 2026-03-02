import { create } from "zustand";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface OrganizationState {
  currentOrganization: Organization | null;
  organizations: Organization[];
  setOrganization: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
  clear: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  currentOrganization: null,
  organizations: [],
  setOrganization: (org) => set({ currentOrganization: org }),
  setOrganizations: (orgs) =>
    set((state) => ({
      organizations: orgs,
      currentOrganization: state.currentOrganization ?? orgs[0] ?? null,
    })),
  clear: () => set({ currentOrganization: null, organizations: [] }),
}));
