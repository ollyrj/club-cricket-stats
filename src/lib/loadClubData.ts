import fs from "node:fs";
import path from "node:path";
import type { DashboardData } from "./types";

const dataDir = path.resolve(process.cwd(), "data");

export function getClubSlugs(): string[] {
  const entries = fs.readdirSync(dataDir, { withFileTypes: true });
  return entries
    .filter((d) => d.isDirectory())
    .filter((d) =>
      fs.existsSync(path.join(dataDir, d.name, "dashboard_data.json")),
    )
    .map((d) => d.name);
}

export function loadClubData(slug: string): DashboardData {
  const filePath = path.join(dataDir, slug, "dashboard_data.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as DashboardData;
}
