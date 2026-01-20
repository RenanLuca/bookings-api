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

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

app.get(
  "/health",
  async (_req: Request, res: Response, next: NextFunction) => {
    console.log('[HEALTH] Endpoint /health chamado');
    try {
      console.log('[HEALTH] Tentando conectar ao banco de dados...');
      await sequelize.authenticate();
      console.log('[HEALTH] Banco de dados conectado com sucesso');
      return res.json({ ok: true, db: "connected" });
    } catch (error) {
      console.error('[HEALTH] Erro ao conectar ao banco:', error);
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
