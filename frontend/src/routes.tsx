import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { EventTypesList } from "@/pages/admin/EventTypesList";
import { EventTypeCreate } from "@/pages/admin/EventTypeCreate";
import { EventTypeEdit } from "@/pages/admin/EventTypeEdit";
import { BookingsList } from "@/pages/admin/BookingsList";
import { BookingDetails } from "@/pages/admin/BookingDetails";
import { PublicEventTypesList } from "@/pages/public/PublicEventTypesList";
import { PublicEventTypeDetails } from "@/pages/public/PublicEventTypeDetails";
import { BookingConfirmation } from "@/pages/public/BookingConfirmation";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/public" replace />,
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "event-types", element: <EventTypesList /> },
      { path: "event-types/new", element: <EventTypeCreate /> },
      { path: "event-types/:id/edit", element: <EventTypeEdit /> },
      { path: "bookings", element: <BookingsList /> },
      { path: "bookings/:id", element: <BookingDetails /> },
    ],
  },
  {
    path: "/public",
    element: <PublicLayout />,
    children: [
      { index: true, element: <PublicEventTypesList /> },
      { path: "event-types/:id", element: <PublicEventTypeDetails /> },
      { path: "bookings/:id", element: <BookingConfirmation /> },
    ],
  },
]);
