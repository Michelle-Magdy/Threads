import path from "node:path";
import fs from "node:fs";
import { logger } from "../lib/logger.js";
import { query } from "./db.js";

const migrationsDir = path.resolve(process.cwd(), "src", "migrations");

async function runMigrations() {
  logger.info(`looking for migrations in ${migrationsDir}`);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    logger.info("No migration files");
    return;
  }

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");

    logger.info("Running migrations");
    await query(sql);

    logger.info("Finneshed migration");
  }
}

runMigrations()
  .then(() => {
    logger.info("All migrations runned successfully");
    process.exit(1);
  })
  .catch((err) => {
    logger.error({err,message:"Migrations Failed"});
    process.exit(1);
  });
