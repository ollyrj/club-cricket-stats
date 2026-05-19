import minimist from "minimist";
import { clubs } from "./clubs.config";
import { scrapeClub } from "./capture";

const args = minimist(process.argv.slice(2));

async function main(): Promise<void> {
  // --season=2026 limits the scrape to a single season (weekly update mode)
  const seasonOverride: string | undefined = args.season
    ? String(args.season)
    : undefined;

  if (args.all) {
    console.log(`Scraping all ${clubs.length} clubs …`);
    for (const club of clubs) {
      await scrapeClub(club, seasonOverride);
    }
  } else if (args.club) {
    const club = clubs.find((c) => c.slug === args.club);
    if (!club) {
      console.error(`Unknown club: ${args.club}`);
      console.error(`Available: ${clubs.map((c) => c.slug).join(", ")}`);
      process.exit(1);
    }
    await scrapeClub(club, seasonOverride);
  } else {
    console.error(
      "Usage:\n" +
        "  npm run scrape -- --club=<slug>              (full scrape, all seasons)\n" +
        "  npm run scrape -- --club=<slug> --season=2026 (weekly update, one season)\n" +
        "  npm run scrape:all                            (all clubs, all seasons)",
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n✖ Scraper failed:", err);
  process.exit(1);
});
