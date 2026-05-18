import type { DashboardData, PerfEntry } from "../src/lib/types";

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

export function parseDate(label: string): string {
  const m = label.match(/^(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})$/);
  if (!m) return label;
  return `${m[3]}-${MONTHS[m[2]]}-${m[1].padStart(2, "0")}`;
}

export function extractOpposition(match: string, clubName: string): string {
  if (!match.includes("Vs")) return "";
  const parts = match.split(" Vs ").map((s) => s.trim());
  const clubLower = clubName.toLowerCase();
  for (const part of parts) {
    if (!part.toLowerCase().includes(clubLower)) return part;
  }
  return parts[1] ?? "";
}

export function buildPlayerPerfs(
  data: DashboardData["data"],
  seasons: string[],
  teams: string[],
  clubName: string,
): DashboardData["playerPerfs"] {
  const gameTypes = ["League", "Cup", "Friendly"];
  const realTeams = teams.filter((t) => t !== "All");

  const byPlayer: DashboardData["playerPerfs"] = {
    batting: {},
    bowling: {},
  };
  const seen = new Set<string>();

  function ingest(kind: "batting" | "bowling", key: "tp" | "bowlTp"): void {
    for (const season of seasons) {
      for (const gt of gameTypes) {
        for (const team of realTeams) {
          const rows =
            (
              data[season]?.[key] as Record<
                string,
                Record<string, [string, string, string, string][]>
              >
            )?.[gt]?.[team] ?? [];
          for (const r of rows) {
            const [score, player, match, dateLabel] = r;
            const k = `${player}|${dateLabel}|${score}|${team}`;
            if (seen.has(k)) continue;
            seen.add(k);

            const date = parseDate(dateLabel);
            const opposition = extractOpposition(match, clubName);

            const entry: PerfEntry = {
              date,
              dateLabel,
              team,
              season,
              gt: gt as PerfEntry["gt"],
              score,
              opposition,
            };

            (byPlayer[kind][player] ??= []).push(entry);
          }
        }
      }
    }
    for (const p of Object.keys(byPlayer[kind])) {
      byPlayer[kind][p].sort((a, b) => b.date.localeCompare(a.date));
    }
  }

  ingest("batting", "tp");
  ingest("bowling", "bowlTp");
  return byPlayer;
}
