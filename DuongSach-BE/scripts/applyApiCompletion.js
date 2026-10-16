import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// For installations bootstrapped with `prisma db push` (including Render).
// The versioned migration remains the preferred path for migration-managed DBs.
export async function applyApiCompletion() {
  const db = new PrismaClient();
  try {
    const source = await fs.readFile(
      new URL("../prisma/api-completion-constraints.sql", import.meta.url),
      "utf8",
    );
    const statements = source
      .replace(/^--.*$/gm, "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    await db.$transaction(async (tx) => {
      for (const statement of statements) {
        const constraint = statement.match(
          /^ALTER TABLE (\w+) ADD CONSTRAINT (\w+)/i,
        );
        if (constraint) {
          const existing =
            await tx.$queryRaw`SELECT 1 FROM pg_constraint WHERE conname = ${constraint[2]} AND conrelid = ${constraint[1]}::regclass`;
          if (existing.length) continue;
        }
        await tx.$executeRawUnsafe(statement);
      }
    });
    console.log("API completion constraints and permissions are ready.");
  } finally {
    await db.$disconnect();
  }
}
if (process.argv[1]?.endsWith("applyApiCompletion.js"))
  applyApiCompletion().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
