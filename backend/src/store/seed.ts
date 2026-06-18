import { store } from "./index";
import { Owner } from "../types";

const OWNER_ID = "00000000-0000-0000-0000-000000000001";

const owner: Owner = {
  id: OWNER_ID,
  name: "Анна Смирнова",
  email: "anna@example.com",
  timezone: "Europe/Moscow",
  avatar: "https://i.pravatar.cc/150?u=anna",
};

export function seed() {
  store.owner = owner;
  console.log("[seed] Data seeded successfully");
}
