import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { sequelize } from "./config/db.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { appointmentsRoutes } from "./modules/appointments/appointments.routes.js";
import { customersRoutes } from "./modules/customers/customers.routes.js";
import { logsRoutes } from "./modules/logs/logs.routes.js";
import { roomsRoutes } from "./modules/rooms/rooms.routes.js";
import { errorHandler } from "./shared/http/error-handler.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
}));

app.use(express.json());
app.use(authRoutes);
app.use(customersRoutes);
app.use(roomsRoutes);
app.use(appointmentsRoutes);
app.use(logsRoutes);

app.get("/health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await sequelize.authenticate();
    return res.json({ ok: true, db: "connected" });
  } catch (error) {
    return next(error);
  }
});

app.use(errorHandler);

export { app };
export default app;
