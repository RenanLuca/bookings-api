import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { sequelize } from "./config/sequelize.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { appointmentsRoutes } from "./modules/appointments/appointments.routes.js";
import { customersRoutes } from "./modules/customers/customers.routes.js";
import { logsRoutes } from "./modules/logs/logs.routes.js";
import { roomsRoutes } from "./modules/rooms/rooms.routes.js";
import { corsOptions } from "./shared/http/cors.js";
import { errorHandler } from "./shared/http/error-handler.js";


const app = express();

app.use(cors(corsOptions));

app.use(express.json({ limit: "2mb" }));


app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/health/db", async (_req, res, next) => {
  try {
    await sequelize.query("SELECT 1");
    return res.json({ ok: true, db: "connected" });
  } catch (err) {
    return next(err);
  }
});

app.use('/auth', authRoutes);
app.use('/customers', customersRoutes);
app.use('/rooms', roomsRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/logs', logsRoutes);
app.use(errorHandler);


export default app;