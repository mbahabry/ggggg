import { config } from "dotenv";

config();

// Tests never truncate tables, but pointing them at a dedicated database avoids
// mixing test fixtures with the demo seed data. Set TEST_DATABASE_URL to opt in.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
