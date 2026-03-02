/**
 * Utility functions for consistent error handling across server actions
 * and client-side error boundaries.
 */

/**
 * Extracts a user-friendly error message from an unknown error value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Si è verificato un errore imprevisto";
}

/**
 * Checks whether an error indicates a "not found" condition,
 * including PostgREST PGRST116 (row not found) errors from Supabase.
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("not found") ||
      error.message.includes("PGRST116")
    );
  }
  return false;
}

/**
 * Checks whether an error indicates an authentication / authorization problem.
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("not authenticated") ||
      msg.includes("jwt") ||
      msg.includes("unauthorized") ||
      msg.includes("non autenticato")
    );
  }
  return false;
}

/**
 * Sanitizes an error message for safe display in the UI.
 * Strips potential stack traces and internal details.
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove file paths
  const cleaned = message.replace(/\/[\w./\\-]+/g, "[path]");
  // Truncate very long messages
  if (cleaned.length > 300) {
    return cleaned.slice(0, 297) + "...";
  }
  return cleaned;
}
