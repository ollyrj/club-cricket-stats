import type { ClubTheme } from "../src/lib/types";

export type ClubConfig = {
  slug: string;
  name: string;
  playCricketSubdomain: string;
  teamIds: Record<string, number>;
  enabledSeasons: string[];
  theme: ClubTheme;
};

export const clubs: ClubConfig[] = [
  {
    slug: "sunbury",
    name: "Sunbury CC",
    playCricketSubdomain: "sunbury",
    teamIds: {
      "1st XI": 29506,
      "2nd XI": 29507,
      "3rd XI": 29508,
      "4th XI": 29509,
      "5th XI": 57498,
      "6th XI": 127498,
    },
    enabledSeasons: ["2023", "2024", "2025", "2026"],
    theme: {
      primary: "#0B4169",
      primaryDark: "#082f4a",
      accent: "#F2C94C",
    },
  },
  {
    slug: "roegreen",
    name: "Roe Green CC",
    playCricketSubdomain: "roegreen",
    teamIds: {
      "1st XI": 67001,
      "2nd XI": 67002,
      "3rd XI": 67003,
    },
    enabledSeasons: ["2023", "2024", "2025", "2026"],
    theme: {
      primary: "#1e6a47",
      primaryDark: "#154d33",
      accent: "#000000",
    },
  },
];
