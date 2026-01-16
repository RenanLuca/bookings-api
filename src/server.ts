import "dotenv/config";
import { app } from "./app.js";
import { sequelize } from "./config/db.js";
import "./models/index.js";

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  try {
    await sequelize.authenticate();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();
