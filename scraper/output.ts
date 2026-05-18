import fs from "node:fs";
import path from "node:path";
import type { DashboardData } from "../src/lib/types";

function sortedReplacer(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    );
  }
  return value;
}

export function writeDashboardData(slug: string, data: DashboardData): void {
  const dir = path.resolve("data", slug);
  fs.mkdirSync(dir, { recursive: true });

  const outPath = path.join(dir, "dashboard_data.json");
  const json = JSON.stringify(data, sortedReplacer, 2) + "\n";
  fs.writeFileSync(outPath, json, "utf-8");

  const sizeKb = (Buffer.byteLength(json) / 1024).toFixed(0);
  console.log(`  Wrote ${outPath} (${sizeKb} KB)`);
}
