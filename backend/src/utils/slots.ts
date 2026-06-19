import { EventType, Booking, Slot } from "../types";
import { store } from "../store";

/**
 * Returns a UTC Date that corresponds to the given local hour/minute
 * in the specified time zone on the calendar day of `date`.
 */
function getTimeInTimezone(
  date: Date,
  timeZone: string,
  localHour: number,
  localMinute: number
): Date {
  let candidate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), localHour, localMinute)
  );

  for (let i = 0; i < 3; i++) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(candidate);
    const hour = parseInt(parts.find((p) => p.type === "hour")!.value);
    const minute = parseInt(parts.find((p) => p.type === "minute")!.value);

    const diffMs = ((localHour - hour) * 60 + (localMinute - minute)) * 60 * 1000;
    if (diffMs === 0) break;
    candidate = new Date(candidate.getTime() + diffMs);
  }

  return candidate;
}

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

  const owner = store.owner;
  const timeZone = owner?.timezone || "UTC";

  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed" && b.slotId.startsWith(eventType.id)
  );

  for (
    let day = new Date(startDate);
    day <= endDate;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const dayStart = getTimeInTimezone(day, timeZone, workStartHour, 0);

    for (let min = 0; min < (workEndHour - workStartHour) * 60; min += eventType.durationMinutes) {
      const currentStart = new Date(dayStart.getTime() + min * 60 * 1000);
      const currentEnd = new Date(currentStart.getTime() + durationMs);

      // Check if the slot ends within working hours in the owner's timezone
      const endParts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).formatToParts(currentEnd);
      const endHour = parseInt(endParts.find((p) => p.type === "hour")!.value);
      const endMinute = parseInt(endParts.find((p) => p.type === "minute")!.value);

      if (endHour > workEndHour || (endHour === workEndHour && endMinute > 0)) {
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

  return slots;
}
