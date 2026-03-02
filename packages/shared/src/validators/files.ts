import { z } from "zod";

export const registerFileSchema = z.object({
  organization_id: z.string().uuid(),
  analysis_id: z.string().uuid().optional().nullable(),
  file_name: z.string().min(1).max(500),
  mime_type: z.string().max(255),
  size_bytes: z.number().int().nonnegative(),
  storage_key: z.string().min(1),
});

export type RegisterFileInput = z.infer<typeof registerFileSchema>;
