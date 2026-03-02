import { describe, it, expect, beforeEach } from "vitest";
import { useOrganizationStore } from "@/stores/organization-store";

const mockOrg1 = {
  id: "org-1",
  name: "AzzeroCO2 Srl",
  slug: "azzeroco2-srl",
  plan: "premium",
  role: "admin",
};

const mockOrg2 = {
  id: "org-2",
  name: "Energetica SpA",
  slug: "energetica-spa",
  plan: "standard",
  role: "member",
};

const mockOrg3 = {
  id: "org-3",
  name: "GreenPower",
  slug: "greenpower",
  plan: "free",
  role: "member",
};

describe("useOrganizationStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useOrganizationStore.setState({
      currentOrganization: null,
      organizations: [],
    });
  });

  describe("initial state", () => {
    it("should have currentOrganization as null", () => {
      expect(useOrganizationStore.getState().currentOrganization).toBeNull();
    });

    it("should have organizations as an empty array", () => {
      expect(useOrganizationStore.getState().organizations).toEqual([]);
    });
  });

  describe("setOrganization", () => {
    it("should set the current organization", () => {
      useOrganizationStore.getState().setOrganization(mockOrg1);
      expect(useOrganizationStore.getState().currentOrganization).toEqual(
        mockOrg1
      );
    });

    it("should replace the current organization", () => {
      useOrganizationStore.getState().setOrganization(mockOrg1);
      useOrganizationStore.getState().setOrganization(mockOrg2);
      expect(useOrganizationStore.getState().currentOrganization).toEqual(
        mockOrg2
      );
    });
  });

  describe("setOrganizations", () => {
    it("should set the organizations list", () => {
      useOrganizationStore.getState().setOrganizations([mockOrg1, mockOrg2]);
      expect(useOrganizationStore.getState().organizations).toEqual([
        mockOrg1,
        mockOrg2,
      ]);
    });

    it("should auto-select the first org as current if none is set", () => {
      useOrganizationStore
        .getState()
        .setOrganizations([mockOrg2, mockOrg1, mockOrg3]);
      expect(useOrganizationStore.getState().currentOrganization).toEqual(
        mockOrg2
      );
    });

    it("should keep existing currentOrganization if already set", () => {
      useOrganizationStore.getState().setOrganization(mockOrg1);
      useOrganizationStore
        .getState()
        .setOrganizations([mockOrg2, mockOrg3]);
      // Should keep mockOrg1 because currentOrganization was already set
      expect(useOrganizationStore.getState().currentOrganization).toEqual(
        mockOrg1
      );
    });

    it("should set currentOrganization to null if list is empty and no current", () => {
      useOrganizationStore.getState().setOrganizations([]);
      expect(useOrganizationStore.getState().currentOrganization).toBeNull();
    });
  });

  describe("clear", () => {
    it("should reset currentOrganization to null", () => {
      useOrganizationStore.getState().setOrganization(mockOrg1);
      useOrganizationStore.getState().clear();
      expect(useOrganizationStore.getState().currentOrganization).toBeNull();
    });

    it("should reset organizations to empty array", () => {
      useOrganizationStore
        .getState()
        .setOrganizations([mockOrg1, mockOrg2]);
      useOrganizationStore.getState().clear();
      expect(useOrganizationStore.getState().organizations).toEqual([]);
    });
  });
});
