import { z } from "zod";

export const createEventTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(1).max(480),
});

export const updateEventTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
});
