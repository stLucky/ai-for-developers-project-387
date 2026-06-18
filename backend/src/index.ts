import express from "express";
import cors from "cors";
import path from "path";
import adminRoutes from "./routes/admin";
import publicRoutes from "./routes/public";
import { errorHandler } from "./middleware/errorHandler";
import { seed } from "./store/seed";
import { store } from "./store";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

seed();

// API routes
const apiRouter = express.Router();
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/public", publicRoutes);

if (process.env.NODE_ENV === "test") {
  apiRouter.post("/__test/reset", (_req, res) => {
    store.eventTypes.clear();
    store.bookings.clear();
    seed();
    res.json({ message: "Store reset" });
  });

  apiRouter.post("/__test/bookings", (req, res) => {
    const { id, slotId, guestName, guestEmail, status, notes, createdAt } = req.body as {
      id?: string;
      slotId: string;
      guestName: string;
      guestEmail: string;
      status: string;
      notes?: string;
      createdAt?: string;
    };
    const booking = {
      id: id || require("uuid").v4(),
      slotId,
      guestName,
      guestEmail,
      notes: notes || undefined,
      status: status as "confirmed" | "cancelled",
      createdAt: createdAt || new Date().toISOString(),
    };
    store.bookings.set(booking.id, booking);
    res.status(201).json(booking);
  });
}

apiRouter.use(errorHandler);
app.use("/api", apiRouter);

// Serve frontend static files
const staticPath = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(staticPath));

// SPA fallback — send index.html for all non-API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ code: "NOT_FOUND", message: "API endpoint not found" });
  }
  res.sendFile(path.join(staticPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[server] Call Booking API running at http://localhost:${PORT}`);
});
