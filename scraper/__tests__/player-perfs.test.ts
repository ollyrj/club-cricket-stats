import { describe, it, expect } from "vitest";
import {
  parseDate,
  extractOpposition,
  buildPlayerPerfs,
} from "../player-perfs";

describe("parseDate", () => {
  it("converts '12 Jul 2025' to '2025-07-12'", () => {
    expect(parseDate("12 Jul 2025")).toBe("2025-07-12");
  });

  it("pads single-digit days", () => {
    expect(parseDate("3 Jan 2024")).toBe("2024-01-03");
  });

  it("returns input unchanged for unrecognized format", () => {
    expect(parseDate("unknown")).toBe("unknown");
  });
});

describe("extractOpposition", () => {
  it("returns the non-club side", () => {
    expect(
      extractOpposition(
        "Sunbury CC - 1st XI Vs Hampton Wick Royal CC - 2nd XI",
        "Sunbury CC",
      ),
    ).toBe("Hampton Wick Royal CC - 2nd XI");
  });

  it("is case-insensitive", () => {
    expect(
      extractOpposition("sunbury cc - 1st XI Vs Other CC", "Sunbury CC"),
    ).toBe("Other CC");
  });

  it("returns empty string when no Vs", () => {
    expect(extractOpposition("Just a match", "Sunbury CC")).toBe("");
  });

  it("falls back to second part if both contain club name", () => {
    expect(
      extractOpposition("Sunbury CC - A Vs Sunbury CC - B", "Sunbury CC"),
    ).toBe("Sunbury CC - B");
  });
});

describe("buildPlayerPerfs", () => {
  it("de-duplicates performances across teams", () => {
    const data = {
      "2025": {
        bat: {},
        bowl: {},
        tp: {
          League: {
            "1st XI": [["50", "Player A", "Team Vs Opp", "12 Jul 2025"]],
          },
          Cup: {
            "1st XI": [["50", "Player A", "Team Vs Opp", "12 Jul 2025"]],
          },
        },
        bowlTp: { League: {}, Cup: {} },
      },
    };

    const result = buildPlayerPerfs(
      data as never,
      ["2025"],
      ["All", "1st XI", "2nd XI"],
      "Team",
    );

    expect(result.batting["Player A"]).toHaveLength(1);
  });

  it("sorts performances by date descending", () => {
    const data = {
      "2025": {
        bat: {},
        bowl: {},
        tp: {
          League: {
            "1st XI": [
              ["30", "Player A", "Team Vs Opp", "01 Jun 2025"],
              ["80", "Player A", "Team Vs Opp", "15 Aug 2025"],
            ],
          },
        },
        bowlTp: { League: {} },
      },
    };

    const result = buildPlayerPerfs(
      data as never,
      ["2025"],
      ["All", "1st XI"],
      "Team",
    );

    expect(result.batting["Player A"][0].score).toBe("80");
    expect(result.batting["Player A"][1].score).toBe("30");
  });

  it("skips All team to avoid duplication", () => {
    const data = {
      "2025": {
        bat: {},
        bowl: {},
        tp: {
          League: {
            All: [["50", "Player A", "Team Vs Opp", "12 Jul 2025"]],
            "1st XI": [["50", "Player A", "Team Vs Opp", "12 Jul 2025"]],
          },
        },
        bowlTp: { League: {} },
      },
    };

    const result = buildPlayerPerfs(
      data as never,
      ["2025"],
      ["All", "1st XI"],
      "Team",
    );

    expect(result.batting["Player A"]).toHaveLength(1);
    expect(result.batting["Player A"][0].team).toBe("1st XI");
  });
});
