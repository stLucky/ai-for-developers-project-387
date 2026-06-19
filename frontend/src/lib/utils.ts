import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInTimeZone(
  date: string | Date,
  timeZone: string,
  format: "HH:mm" | "dd.MM.yyyy HH:mm" | "EEEE, d MMMM"
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "HH:mm") {
    return new Intl.DateTimeFormat("ru-RU", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  }

  if (format === "dd.MM.yyyy HH:mm") {
    const parts = new Intl.DateTimeFormat("ru-RU", {
      timeZone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);

    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const year = parts.find((p) => p.type === "year")?.value ?? "";
    const hour = parts.find((p) => p.type === "hour")?.value ?? "";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "";

    return `${day}.${month}.${year} ${hour}:${minute}`;
  }

  if (format === "EEEE, d MMMM") {
    const parts = new Intl.DateTimeFormat("ru-RU", {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).formatToParts(d);

    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";

    return `${weekday}, ${day} ${month}`;
  }

  return "";
}
