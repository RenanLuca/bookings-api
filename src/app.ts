// src/app.ts
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { sequelize } from "./config/sequelize.js";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { appointmentsRoutes } from "./modules/appointments/appointments.routes.js";
import { customersRoutes } from "./modules/customers/customers.routes.js";
import { logsRoutes } from "./modules/logs/logs.routes.js";
import { roomsRoutes } from "./modules/rooms/rooms.routes.js";

import { errorHandler } from "./shared/http/error-handler.js";

const app = express();

const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.get(
  "/health",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await sequelize.authenticate();
      return res.json({ ok: true, db: "connected" });
    } catch (error) {
      return next(error);
    }
  }
);

app.use(authRoutes);
app.use(customersRoutes);
app.use(roomsRoutes);
app.use(appointmentsRoutes);
app.use(logsRoutes);
app.use(errorHandler);

export default app;
