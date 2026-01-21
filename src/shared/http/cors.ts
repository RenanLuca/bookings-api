import cors from "cors";

const normalizeOrigin = (url?: string) => {
  if (!url) return null;
  return url.replace(/\/$/, "");
};

const allowedOrigins = [
  normalizeOrigin(process.env.BACKOFFICE_URL),
  normalizeOrigin(process.env.CUSTOMER_URL),
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export { corsOptions };
