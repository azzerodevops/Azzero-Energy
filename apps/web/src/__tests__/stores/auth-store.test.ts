import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import type { User, Session } from "@supabase/supabase-js";

// Minimal mock objects matching Supabase types
const mockUser: User = {
  id: "user-123",
  email: "test@azzeroco2.it",
  app_metadata: {},
  user_metadata: { full_name: "Test User" },
  aud: "authenticated",
  created_at: "2025-01-01T00:00:00Z",
} as User;

const mockSession: Session = {
  access_token: "access-token-abc",
  refresh_token: "refresh-token-xyz",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: mockUser,
} as Session;

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: true,
    });
  });

  describe("initial state", () => {
    it("should have user as null", () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("should have session as null", () => {
      expect(useAuthStore.getState().session).toBeNull();
    });

    it("should have isLoading as true", () => {
      expect(useAuthStore.getState().isLoading).toBe(true);
    });
  });

  describe("setAuth", () => {
    it("should set user and session", () => {
      useAuthStore.getState().setAuth(mockUser, mockSession);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
    });

    it("should set isLoading to false after setAuth", () => {
      useAuthStore.getState().setAuth(mockUser, mockSession);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("should accept null user and null session", () => {
      // First set auth, then clear via setAuth
      useAuthStore.getState().setAuth(mockUser, mockSession);
      useAuthStore.getState().setAuth(null, null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe("setLoading", () => {
    it("should set isLoading to true", () => {
      useAuthStore.setState({ isLoading: false });
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it("should set isLoading to false", () => {
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("clear", () => {
    it("should reset user and session to null", () => {
      useAuthStore.getState().setAuth(mockUser, mockSession);
      useAuthStore.getState().clear();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
    });

    it("should set isLoading to false after clear", () => {
      useAuthStore.getState().clear();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
