import * as cheerio from "cheerio";
import type { BatRow, BowlRow, TopBat, TopBowl } from "../src/lib/types";

type CheerioAPI = ReturnType<typeof cheerio.load>;

function findTableByHeaders(
  $: CheerioAPI,
  requiredHeaders: string[],
): ReturnType<CheerioAPI> | null {
  let found: ReturnType<CheerioAPI> | null = null;

  $("table").each((_, table) => {
    if (found) return;
    const headers = $(table)
      .find("tr")
      .first()
      .find("td, th")
      .map((_, el) => $(el).text().trim())
      .get();
    if (requiredHeaders.every((h) => headers.includes(h))) {
      found = $(table);
    }
  });

  return found;
}

export function parseBattingTable(html: string): BatRow[] {
  const $ = cheerio.load(html);
  const table = findTableByHeaders($, ["RUNS", "AVG"]);
  if (!table) return [];

  const rows: BatRow[] = [];
  table.find("tr").each((i, tr) => {
    if (i === 0) return;
    const cells = $(tr)
      .find("td")
      .map((_, td) => $(td).text().trim())
      .get();
    if (cells.length >= 11 && /^\d+$/.test(cells[0])) {
      rows.push([
        +cells[0],
        cells[1],
        +cells[2],
        +cells[3],
        +cells[4],
        +cells[5],
        cells[6],
        parseFloat(cells[7]) || 0,
        +cells[8],
        +cells[9],
        parseFloat(cells[10]) || 0,
      ]);
    }
  });
  return rows;
}

export function parseBowlingTable(html: string): BowlRow[] {
  const $ = cheerio.load(html);
  const table = findTableByHeaders($, ["WICKETS", "OVERS"]);
  if (!table) return [];

  const rows: BowlRow[] = [];
  table.find("tr").each((i, tr) => {
    if (i === 0) return;
    const cells = $(tr)
      .find("td")
      .map((_, td) => $(td).text().trim())
      .get();
    if (cells.length >= 11 && /^\d+$/.test(cells[0])) {
      rows.push([
        +cells[0],
        cells[1],
        parseFloat(cells[2]) || 0,
        +cells[3] || 0,
        +cells[4] || 0,
        +cells[5] || 0,
        cells[6],
        +cells[7] || 0,
        parseFloat(cells[8]) || 0,
        parseFloat(cells[9]) || 0,
        parseFloat(cells[10]) || 0,
      ]);
    }
  });
  return rows;
}

export function parseTopBatting(html: string): TopBat[] {
  const $ = cheerio.load(html);
  const table = findTableByHeaders($, ["SCORE", "NAME"]);
  if (!table) return [];

  const rows: TopBat[] = [];
  table.find("tr").each((i, tr) => {
    if (i === 0) return;
    const cells = $(tr)
      .find("td")
      .map((_, td) => $(td).text().trim())
      .get();
    if (cells.length >= 4 && /^\d/.test(cells[0])) {
      rows.push([cells[0], cells[1], cleanMatch(cells[2]), cells[3]]);
    }
  });
  return rows;
}

export function parseTopBowling(html: string): TopBowl[] {
  const $ = cheerio.load(html);
  const table = findTableByHeaders($, ["NAME", "DATE"]);
  if (!table) return [];

  // Verify it also has WICKET or FIGURES header
  const headers = table
    .find("tr")
    .first()
    .find("td, th")
    .map((_, el) => $(el).text().trim())
    .get();
  if (!headers.includes("WICKET") && !headers.includes("FIGURES")) return [];

  const rows: TopBowl[] = [];
  table.find("tr").each((i, tr) => {
    if (i === 0) return;
    const cells = $(tr)
      .find("td")
      .map((_, td) => $(td).text().trim())
      .get();
    if (cells.length >= 4 && /^\d+\s*\/\s*\d+/.test(cells[0])) {
      rows.push([cells[0], cells[1], cleanMatch(cells[2]), cells[3]]);
    }
  });
  return rows;
}

export function cleanMatch(s: string): string {
  return s
    .replace(/[\t\xa0\n]+/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/ +Vs +/g, " Vs ")
    .trim();
}
