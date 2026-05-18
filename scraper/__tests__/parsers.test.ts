import { describe, it, expect } from "vitest";
import {
  parseBattingTable,
  parseBowlingTable,
  parseTopBatting,
  parseTopBowling,
  cleanMatch,
} from "../parsers";

const battingHtml = `<table>
  <tr><th>RANK</th><th>PLAYER</th><th>GAMES</th><th>INNS</th><th>NOT OUTS</th><th>RUNS</th><th>HIGH SCORE</th><th>AVG</th><th>50s</th><th>100s</th><th>STRIKE RATE</th></tr>
  <tr><td>1</td><td>Hugh Weibgen</td><td>14</td><td>13</td><td>2</td><td>773</td><td>180</td><td>70.27</td><td>4</td><td>3</td><td>96.75</td></tr>
  <tr><td>2</td><td>Ayush Obhrai</td><td>18</td><td>17</td><td>0</td><td>560</td><td>100*</td><td>32.94</td><td>3</td><td>1</td><td>73.49</td></tr>
</table>`;

const bowlingHtml = `<table>
  <tr><th>RANK</th><th>PLAYER</th><th>OVERS</th><th>MAIDENS</th><th>RUNS</th><th>WICKETS</th><th>BEST BOWLING</th><th>5 WICKET HAUL</th><th>ECONOMY RATE</th><th>STRIKE RATE</th><th>AVERAGE</th></tr>
  <tr><td>1</td><td>Curt Higgins</td><td>122.1</td><td>20</td><td>560</td><td>37</td><td>4/27</td><td>0</td><td>4.58</td><td>19.81</td><td>15.14</td></tr>
</table>`;

const topBatHtml = `<table>
  <tr><th>SCORE</th><th>NAME</th><th>MATCH</th><th>DATE</th></tr>
  <tr><td>249</td><td>Aditya Prakasan</td><td>Sunbury CC - 1st XI  Vs  Hampton Wick Royal CC - 2nd XI</td><td>12 Jul 2025</td></tr>
  <tr><td>186*</td><td>Tyrone Visvakula</td><td>Sunbury CC - 1st XI\tVs\tSunbury CC - 2nd XI</td><td>09 Aug 2025</td></tr>
</table>`;

const topBowlHtml = `<table>
  <tr><th>WICKET</th><th>NAME</th><th>MATCH</th><th>DATE</th></tr>
  <tr><td>6/19</td><td>Rajiv Chadha</td><td>Old Woking CC - Sat 1st XI  Vs  Sunbury CC - 4th XI</td><td>28 Jun 2025</td></tr>
</table>`;

describe("parseBattingTable", () => {
  it("parses a standard batting table", () => {
    const rows = parseBattingTable(battingHtml);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual([
      1,
      "Hugh Weibgen",
      14,
      13,
      2,
      773,
      "180",
      70.27,
      4,
      3,
      96.75,
    ]);
    expect(rows[1][1]).toBe("Ayush Obhrai");
    expect(rows[1][6]).toBe("100*");
  });

  it("returns empty array for no matching table", () => {
    expect(
      parseBattingTable("<table><tr><td>No data</td></tr></table>"),
    ).toEqual([]);
  });

  it("returns empty array for empty HTML", () => {
    expect(parseBattingTable("")).toEqual([]);
  });
});

describe("parseBowlingTable", () => {
  it("parses a standard bowling table", () => {
    const rows = parseBowlingTable(bowlingHtml);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      1,
      "Curt Higgins",
      122.1,
      20,
      560,
      37,
      "4/27",
      0,
      4.58,
      19.81,
      15.14,
    ]);
  });

  it("returns empty array for no matching table", () => {
    expect(parseBowlingTable("<div>nothing</div>")).toEqual([]);
  });
});

describe("parseTopBatting", () => {
  it("parses top batting performances", () => {
    const rows = parseTopBatting(topBatHtml);
    expect(rows).toHaveLength(2);
    expect(rows[0][0]).toBe("249");
    expect(rows[0][1]).toBe("Aditya Prakasan");
    expect(rows[0][3]).toBe("12 Jul 2025");
  });

  it("cleans match text with tabs/extra spaces", () => {
    const rows = parseTopBatting(topBatHtml);
    expect(rows[1][2]).toBe("Sunbury CC - 1st XI Vs Sunbury CC - 2nd XI");
  });
});

describe("parseTopBowling", () => {
  it("parses top bowling performances", () => {
    const rows = parseTopBowling(topBowlHtml);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      "6/19",
      "Rajiv Chadha",
      "Old Woking CC - Sat 1st XI Vs Sunbury CC - 4th XI",
      "28 Jun 2025",
    ]);
  });

  it("handles FIGURES header variant", () => {
    const html = topBowlHtml.replace("WICKET", "FIGURES");
    const rows = parseTopBowling(html);
    expect(rows).toHaveLength(1);
  });
});

describe("cleanMatch", () => {
  it("normalizes whitespace and Vs spacing", () => {
    expect(cleanMatch("Team A   Vs   Team B")).toBe("Team A Vs Team B");
    expect(cleanMatch("Team\tA\nVs\nTeam B")).toBe("Team A Vs Team B");
    expect(cleanMatch("  Team A  ")).toBe("Team A");
  });
});
