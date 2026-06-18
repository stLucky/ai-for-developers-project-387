import { Owner, EventType, Booking } from "../types";

export const store = {
  owner: null as Owner | null,
  eventTypes: new Map<string, EventType>(),
  bookings: new Map<string, Booking>(),
};
