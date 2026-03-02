import { describe, it, expect, beforeEach } from "vitest";
import { useSidebarStore } from "@/stores/sidebar-store";

describe("useSidebarStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useSidebarStore.setState({ isCollapsed: false });
  });

  describe("initial state", () => {
    it("should start with sidebar expanded (isCollapsed = false)", () => {
      const state = useSidebarStore.getState();
      expect(state.isCollapsed).toBe(false);
    });
  });

  describe("toggle", () => {
    it("should collapse the sidebar when currently expanded", () => {
      useSidebarStore.getState().toggle();
      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });

    it("should expand the sidebar when currently collapsed", () => {
      useSidebarStore.setState({ isCollapsed: true });
      useSidebarStore.getState().toggle();
      expect(useSidebarStore.getState().isCollapsed).toBe(false);
    });

    it("should alternate state on repeated toggles", () => {
      const { toggle } = useSidebarStore.getState();
      toggle();
      expect(useSidebarStore.getState().isCollapsed).toBe(true);
      toggle();
      expect(useSidebarStore.getState().isCollapsed).toBe(false);
      toggle();
      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });
  });

  describe("collapse", () => {
    it("should set isCollapsed to true", () => {
      useSidebarStore.getState().collapse();
      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });

    it("should remain collapsed if already collapsed", () => {
      useSidebarStore.setState({ isCollapsed: true });
      useSidebarStore.getState().collapse();
      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });
  });

  describe("expand", () => {
    it("should set isCollapsed to false", () => {
      useSidebarStore.setState({ isCollapsed: true });
      useSidebarStore.getState().expand();
      expect(useSidebarStore.getState().isCollapsed).toBe(false);
    });

    it("should remain expanded if already expanded", () => {
      useSidebarStore.getState().expand();
      expect(useSidebarStore.getState().isCollapsed).toBe(false);
    });
  });
});
