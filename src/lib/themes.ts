import type { ClubTheme } from "./types";

export const themes: Record<string, ClubTheme> = {
  sunbury: {
    primary: "#0B4169",
    primaryDark: "#082f4a",
    accent: "#F2C94C",
  },
  roegreen: {
    primary: "#1e6a47",
    primaryDark: "#154d33",
    accent: "#000000",
  },
};

export function getTheme(slug: string): ClubTheme {
  return (
    themes[slug] ?? {
      primary: "#0B4169",
      primaryDark: "#082f4a",
      accent: "#F2C94C",
    }
  );
}
