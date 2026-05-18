import type { Page } from "playwright";

const USER_AGENT = "ClubStats-Refresh/1.0 (+https://clubstats.uk/about)";

export { USER_AGENT };

export function resolveCredentials(slug: string): {
  email: string;
  password: string;
} {
  const prefix = `PC_${slug.toUpperCase()}`;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASS`];
  if (!email || !password) {
    throw new Error(
      `Missing credentials: set ${prefix}_EMAIL and ${prefix}_PASS environment variables`,
    );
  }
  return { email, password };
}

export async function login(
  page: Page,
  subdomain: string,
  email: string,
  password: string,
): Promise<void> {
  const url = `https://${subdomain}.play-cricket.com/users/sign_in`;
  console.log(`  Logging in to ${subdomain}.play-cricket.com …`);

  await page.goto(url, { timeout: 30_000 });
  await page.fill('input[name="user[email]"]', email);
  await page.fill('input[name="user[password]"]', password);
  await page.click('input[type="submit"]');
  await page.waitForURL("**/home", { timeout: 30_000 });

  console.log("  Login successful.");
}
