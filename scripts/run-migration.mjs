import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.ts";
import { migrate } from "drizzle-orm/mysql2/migrator";
import "dotenv/config";

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "defaultdb",
});

const db = drizzle(connection, { schema, mode: "default" });

console.log("Running migrations...");

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✅ Migrations completed successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

await connection.end();
