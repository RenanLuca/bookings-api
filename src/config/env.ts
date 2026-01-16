import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "development" | "test" | "production";

const readVariable = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable ${key}`);
  }
  return value;
};

const toNumber = (value: string, key: string) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for ${key}`);
  }
  return parsed;
};

const normalizeNodeEnv = (value: string): NodeEnv => {
  const normalized = value.toLowerCase();
  const allowed: NodeEnv[] = ["development", "test", "production"];
  if (allowed.includes(normalized as NodeEnv)) {
    return normalized as NodeEnv;
  }
  throw new Error("Invalid NODE_ENV value");
};

const env = {
  nodeEnv: normalizeNodeEnv(readVariable("NODE_ENV", "development")),
  port: toNumber(readVariable("PORT", "3000"), "PORT"),
  db: {
    name: readVariable("DB_NAME", "bookings_db"),
    user: readVariable("DB_USER", "root"),
    pass: readVariable("DB_PASS", ""),
    host: readVariable("DB_HOST", "localhost"),
    port: toNumber(readVariable("DB_PORT", "3306"), "DB_PORT")
  },
  jwtSecret: readVariable("JWT_SECRET"),
  jwtExpiresIn: readVariable("JWT_EXPIRES_IN", "1d")
};

export { env };
export type { NodeEnv };