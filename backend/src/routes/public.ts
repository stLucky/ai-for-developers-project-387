import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { store } from "../store";
import { createBookingSchema } from "../validators/bookings";
import { validateRequest } from "../middleware/validateRequest";
import { generateSlots } from "../utils/slots";

const router = Router();

router.get("/owner", (_req: Request, res: Response) => {
  if (!store.owner) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Owner not found" });
  }
  res.json(store.owner);
});

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

router.get("/event-types/:id/slots", (req: Request, res: Response) => {
  const eventType = store.eventTypes.get(req.params.id);
  if (!eventType) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Event type not found" });
  }
  const { from, to } = req.query;
  const bookings = Array.from(store.bookings.values());
  const slots = generateSlots(
    eventType,
    bookings,
    from as string | undefined,
    to as string | undefined
  );
  res.json(slots);
});

router.post(
  "/bookings",
  validateRequest(createBookingSchema),
  (req: Request, res: Response) => {
    const body = req.body as {
      slotId: string;
      guestName: string;
      guestEmail: string;
      notes?: string;
    };

    // Check if slot is already booked (confirmed)
    const existing = Array.from(store.bookings.values()).find(
      (b) => b.slotId === body.slotId && b.status === "confirmed"
    );
    if (existing) {
      return res.status(409).json({ code: "CONFLICT", message: "Slot is already booked" });
    }

    const booking = {
      id: uuidv4(),
      slotId: body.slotId,
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      notes: body.notes,
      status: "confirmed" as const,
      createdAt: new Date().toISOString(),
    };
    store.bookings.set(booking.id, booking);
    res.status(201).json(booking);
  }
);

router.get("/bookings/:id", (req: Request, res: Response) => {
  const booking = store.bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
  }
  res.json(booking);
});

router.get("/slots/:id", (req: Request, res: Response) => {
  const slotId = req.params.id;
  const underscoreIndex = slotId.indexOf("_");
  if (underscoreIndex === -1) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Slot not found" });
  }

  const eventTypeId = slotId.substring(0, underscoreIndex);
  const startTimeStr = slotId.substring(underscoreIndex + 1);
  const eventType = store.eventTypes.get(eventTypeId);

  if (!eventType) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Slot not found" });
  }

  const startTime = new Date(startTimeStr);
  if (isNaN(startTime.getTime())) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Slot not found" });
  }

  const endTime = new Date(startTime.getTime() + eventType.durationMinutes * 60 * 1000);
  const isBooked = Array.from(store.bookings.values()).some(
    (b) => b.slotId === slotId && b.status === "confirmed"
  );

  res.json({
    id: slotId,
    eventTypeId: eventType.id,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    isAvailable: !isBooked,
  });
});

export default router;
