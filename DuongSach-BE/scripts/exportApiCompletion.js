import fs from "node:fs/promises";
import { completionPaths } from "../src/docs/completion.js";
import { prisma } from "../src/config/database.js";

// This only reads Express registrations; it does not call APIs or query the DB.
try {
  const rows = Object.entries(completionPaths)
    .flatMap(([path, methods]) =>
      Object.keys(methods).map((method) => ({
        method: method.toUpperCase(),
        path: `/api${path}`,
        access: methods[method].security.length ? path.split("/")[1] : "public",
        status:
          path === "/auth/forgot-password"
            ? "503: email provider not configured"
            : "implemented",
      })),
    )
    .sort(
      (a, b) =>
        a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
    );
  const dir = new URL("../docs/", import.meta.url);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    new URL("API-COMPLETION.json", dir),
    JSON.stringify(
      {
        generatedFrom: "src/docs/completion.js router registrations",
        scope:
          "new completion routers, including aliases; excludes existing routes",
        total: rows.length,
        implemented: rows.filter((row) => row.status === "implemented").length,
        endpoints: rows,
      },
      null,
      2,
    ) + "\n",
  );
  const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
  await fs.writeFile(
    new URL("API-COMPLETION.csv", dir),
    "\uFEFF" +
      [
        ["method", "path", "access", "status"],
        ...rows.map((row) => [row.method, row.path, row.access, row.status]),
      ]
        .map((row) => row.map(quote).join(","))
        .join("\n") +
      "\n",
  );
  console.log(`${rows.length} method/path registrations exported.`);
} finally {
  await prisma.$disconnect();
}
