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

const allowedOrigins = [
  process.env.BACKOFFICE_URL,
  process.env.CUSTOMER_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {

      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS bloqueado para: ${origin}`));
    },
    credentials: true, 
  })
);


app.options(/.*/, cors());

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
