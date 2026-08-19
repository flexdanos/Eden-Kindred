import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });

// Migrations run over the DIRECT connection (port 5432), not the transaction
// pooler. DDL needs session-level state that transaction pooling does not keep.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("Set DIRECT_URL (preferred) or DATABASE_URL in .env");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
