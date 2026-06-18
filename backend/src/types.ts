export type Owner = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  avatar: string;
};

export type EventType = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  durationMinutes: number;
};

export type BookingStatus = "confirmed" | "cancelled";

export type Booking = {
  id: string;
  slotId: string;
  guestName: string;
  guestEmail: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
};

export type Slot = {
  id: string;
  eventTypeId: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type NotFoundError = {
  code: "NOT_FOUND";
  message: string;
};

export type ConflictError = {
  code: "CONFLICT";
  message: string;
};

export type ValidationError = {
  code: "VALIDATION_ERROR";
  message: string;
  details?: string[];
};
