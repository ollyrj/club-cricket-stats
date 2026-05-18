import { chromium } from "playwright";
import pLimit from "p-limit";
import type { ClubConfig } from "./clubs.config";
import type { DashboardData } from "../src/lib/types";
import { resolveCredentials, login, USER_AGENT } from "./auth";
import { SEASON_IDS, GAME_TYPES, buildStatsUrl } from "./urls";
import {
  parseBattingTable,
  parseBowlingTable,
  parseTopBatting,
  parseTopBowling,
} from "./parsers";
import { fetchAndParse, type FetchStats } from "./fetcher";
import { buildPlayerPerfs } from "./player-perfs";
import { writeDashboardData } from "./output";

export async function scrapeClub(config: ClubConfig): Promise<void> {
  const start = Date.now();
  console.log(`\n▶ Scraping ${config.name} (${config.slug})`);

  const { email, password } = resolveCredentials(config.slug);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
  });

  try {
    const page = await context.newPage();
    await login(page, config.playCricketSubdomain, email, password);

    const request = context.request;
    const limit = pLimit(5);
    const stats: FetchStats = { total: 0, failures: 0 };

    const teamEntries: [string, string][] = [
      ["All", "all"],
      ...Object.entries(config.teamIds).map(
        ([k, v]) => [k, String(v)] as [string, string],
      ),
    ];

    const data: DashboardData = {
      schemaVersion: 1,
      seasons: config.enabledSeasons,
      gameTypes: GAME_TYPES.map(
        ([label]) => label,
      ) as DashboardData["gameTypes"],
      teams: teamEntries.map(([label]) => label),
      cols: [
        "rank",
        "player",
        "games",
        "inns",
        "no",
        "runs",
        "hs",
        "avg",
        "fifties",
        "hundreds",
        "sr",
      ] as const,
      bowlCols: [
        "rank",
        "player",
        "overs",
        "maidens",
        "runs",
        "wickets",
        "best",
        "fiveW",
        "econ",
        "sr",
        "avg",
      ] as const,
      data: {},
      playerPerfs: { batting: {}, bowling: {} },
      meta: {
        club: config.name,
        source: `https://${config.playCricketSubdomain}.play-cricket.com/Statistics`,
        capturedAt: new Intl.DateTimeFormat("en-GB", {
          month: "long",
          year: "numeric",
        }).format(new Date()),
        rules: "Standard",
        category: "Senior",
      },
    };

    const tasks: (() => Promise<void>)[] = [];

    for (const year of config.enabledSeasons) {
      const seasonId = SEASON_IDS[year];
      if (!seasonId) {
        console.warn(`  ⚠ Unknown season ${year}, skipping`);
        continue;
      }

      data.data[year] = { bat: {}, tp: {}, bowl: {}, bowlTp: {} };

      for (const [gtLabel, gtVal] of GAME_TYPES) {
        data.data[year].bat[gtLabel] = {};
        data.data[year].tp[gtLabel] = {};
        data.data[year].bowl[gtLabel] = {};
        data.data[year].bowlTp[gtLabel] = {};

        for (const [teamLabel, teamId] of teamEntries) {
          const base = {
            subdomain: config.playCricketSubdomain,
            seasonId,
            teamId,
            gameType: gtVal,
          } as const;
          const label = `${year}/${gtLabel}/${teamLabel}`;

          tasks.push(async () => {
            data.data[year].bat[gtLabel]![teamLabel] = await fetchAndParse(
              request,
              buildStatsUrl({ ...base, tab: "Batting", subTab: "Standard" }),
              parseBattingTable,
              `${label}/bat`,
              stats,
            );
          });
          tasks.push(async () => {
            data.data[year].tp[gtLabel]![teamLabel] = await fetchAndParse(
              request,
              buildStatsUrl({
                ...base,
                tab: "Batting",
                subTab: "Top%20Performance",
              }),
              parseTopBatting,
              `${label}/tp`,
              stats,
            );
          });
          tasks.push(async () => {
            data.data[year].bowl![gtLabel]![teamLabel] = await fetchAndParse(
              request,
              buildStatsUrl({ ...base, tab: "Bowling", subTab: "Standard" }),
              parseBowlingTable,
              `${label}/bowl`,
              stats,
            );
          });
          tasks.push(async () => {
            data.data[year].bowlTp[gtLabel]![teamLabel] = await fetchAndParse(
              request,
              buildStatsUrl({
                ...base,
                tab: "Bowling",
                subTab: "Top%20Performance",
              }),
              parseTopBowling,
              `${label}/bowlTp`,
              stats,
            );
          });
        }
      }
    }

    console.log(`  Fetching ${tasks.length} pages (concurrency: 5) …`);
    await Promise.all(tasks.map((fn) => limit(fn)));

    data.playerPerfs = buildPlayerPerfs(
      data.data,
      config.enabledSeasons,
      teamEntries.map(([l]) => l),
      config.name,
    );

    writeDashboardData(config.slug, data);

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const failPct =
      stats.total > 0 ? ((stats.failures / stats.total) * 100).toFixed(1) : "0";
    console.log(
      `  Done: ${stats.total} fetches, ${stats.failures} failures (${failPct}%) in ${elapsed}s`,
    );

    if (stats.total > 0 && stats.failures / stats.total > 0.05) {
      throw new Error(
        `Error budget exceeded: ${stats.failures}/${stats.total} fetches failed (${failPct}%)`,
      );
    }
  } finally {
    await context.close();
    await browser.close();
  }
}
