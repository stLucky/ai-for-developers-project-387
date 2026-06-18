import { EventType, Booking, Slot } from "../types";

export function generateSlots(
  eventType: EventType,
  bookings: Booking[],
  from?: string,
  to?: string
): Slot[] {
  const startDate = from ? new Date(from) : new Date();
  const endDate = to ? new Date(to) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  // Reset to beginning of the day
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(23, 59, 59, 999);

  const slots: Slot[] = [];
  const workStartHour = 9;
  const workEndHour = 18;
  const durationMs = eventType.durationMinutes * 60 * 1000;

  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed" && b.slotId.startsWith(eventType.id)
  );

  for (
    let day = new Date(startDate);
    day <= endDate;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    for (let hour = workStartHour; hour < workEndHour; hour++) {
      const slotStart = new Date(day);
      slotStart.setUTCHours(hour, 0, 0, 0);

      for (let min = 0; min < 60; min += eventType.durationMinutes) {
        const currentStart = new Date(slotStart.getTime() + min * 60 * 1000);
        const currentEnd = new Date(currentStart.getTime() + durationMs);

        if (currentEnd.getUTCHours() > workEndHour || 
            (currentEnd.getUTCHours() === workEndHour && currentEnd.getUTCMinutes() > 0)) {
          continue;
        }

        const slotId = `${eventType.id}_${currentStart.toISOString()}`;
        const isBooked = confirmedBookings.some((b) => b.slotId === slotId);

        slots.push({
          id: slotId,
          eventTypeId: eventType.id,
          startTime: currentStart.toISOString(),
          endTime: currentEnd.toISOString(),
          isAvailable: !isBooked,
        });
      }
    }
  }

  return slots;
}
