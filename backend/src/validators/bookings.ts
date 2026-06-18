import { z } from "zod";

export const createBookingSchema = z.object({
  slotId: z.string().min(1),
  guestName: z.string().min(1).max(100),
  guestEmail: z.string().email(),
  notes: z.string().max(1000).optional(),
});
