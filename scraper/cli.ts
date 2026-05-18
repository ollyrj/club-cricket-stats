import minimist from "minimist";
import { clubs } from "./clubs.config";
import { scrapeClub } from "./capture";

const args = minimist(process.argv.slice(2));

async function main(): Promise<void> {
  if (args.all) {
    console.log(`Scraping all ${clubs.length} clubs …`);
    for (const club of clubs) {
      await scrapeClub(club);
    }
  } else if (args.club) {
    const club = clubs.find((c) => c.slug === args.club);
    if (!club) {
      console.error(`Unknown club: ${args.club}`);
      console.error(`Available: ${clubs.map((c) => c.slug).join(", ")}`);
      process.exit(1);
    }
    await scrapeClub(club);
  } else {
    console.error(
      "Usage: npm run scrape -- --club=<slug>  or  npm run scrape:all",
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n✖ Scraper failed:", err);
  process.exit(1);
});
