import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { store } from "../store";
import { createEventTypeSchema, updateEventTypeSchema } from "../validators/eventTypes";
import { validateRequest } from "../middleware/validateRequest";
import { generateSlots } from "../utils/slots";

const router = Router();

router.get("/owner", (_req: Request, res: Response) => {
  if (!store.owner) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Owner not found" });
  }
  res.json(store.owner);
});

router.post(
  "/event-types",
  validateRequest(createEventTypeSchema),
  (req: Request, res: Response) => {
    if (!store.owner) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Owner not found" });
    }
    const body = req.body as { name: string; description?: string; durationMinutes: number };
    const eventType = {
      id: uuidv4(),
      ownerId: store.owner.id,
      name: body.name,
      description: body.description,
      durationMinutes: body.durationMinutes,
    };
    store.eventTypes.set(eventType.id, eventType);
    res.status(201).json(eventType);
  }
);

router.get("/event-types", (_req: Request, res: Response) => {
  res.json(Array.from(store.eventTypes.values()));
});

router.get("/event-types/:id", (req: Request, res: Response) => {
  const eventType = store.eventTypes.get(req.params.id);
  if (!eventType) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Event type not found" });
  }
  res.json(eventType);
});

router.put(
  "/event-types/:id",
  validateRequest(updateEventTypeSchema),
  (req: Request, res: Response) => {
    const eventType = store.eventTypes.get(req.params.id);
    if (!eventType) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Event type not found" });
    }
    const body = req.body as { name?: string; description?: string; durationMinutes?: number };
    const updated = {
      ...eventType,
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.durationMinutes !== undefined && { durationMinutes: body.durationMinutes }),
    };
    store.eventTypes.set(updated.id, updated);
    res.json(updated);
  }
);

router.delete("/event-types/:id", (req: Request, res: Response) => {
  const eventType = store.eventTypes.get(req.params.id);
  if (!eventType) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Event type not found" });
  }
  store.eventTypes.delete(req.params.id);
  res.status(204).send();
});

router.get("/bookings", (req: Request, res: Response) => {
  const { eventTypeId, status } = req.query;
  let bookings = Array.from(store.bookings.values());
  if (eventTypeId) {
    const et = store.eventTypes.get(eventTypeId as string);
    if (et) {
      // Filter bookings by eventType via slotId prefix
      bookings = bookings.filter((b) => b.slotId.startsWith(et.id));
    }
  }
  if (status) {
    bookings = bookings.filter((b) => b.status === status);
  }
  res.json(bookings);
});

router.get("/bookings/:id", (req: Request, res: Response) => {
  const booking = store.bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
  }
  res.json(booking);
});

router.post("/bookings/:id/cancel", (req: Request, res: Response) => {
  const booking = store.bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
  }
  const updated = { ...booking, status: "cancelled" as const };
  store.bookings.set(updated.id, updated);
  res.json(updated);
});

router.post("/bookings/:id/restore", (req: Request, res: Response) => {
  const booking = store.bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
  }
  // If already confirmed, return idempotently
  if (booking.status === "confirmed") {
    return res.json(booking);
  }
  // Check if slot is already booked by another confirmed booking
  const existing = Array.from(store.bookings.values()).find(
    (b) => b.slotId === booking.slotId && b.status === "confirmed" && b.id !== booking.id
  );
  if (existing) {
    return res.status(409).json({ code: "CONFLICT", message: "Slot is already booked" });
  }
  const updated = { ...booking, status: "confirmed" as const };
  store.bookings.set(updated.id, updated);
  res.json(updated);
});

export default router;
