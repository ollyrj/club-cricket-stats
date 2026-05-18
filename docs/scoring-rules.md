# Cricket Scoring & Fantasy Points

## Standard cricket maths (used throughout the dashboard)

### Batting average
```
avg = runs / (innings - notOuts)
```
Edge case: if `innings = notOuts`, avg is undefined; display as "—".

### Batting strike rate
```
SR = (runs / balls) * 100
```

### Bowling average
```
avg = runsConceded / wicketsTaken
```

### Bowling strike rate
```
SR = ballsBowled / wicketsTaken
```

### Bowling economy
```
econ = (runsConceded / ballsBowled) * 6   // i.e. runs per over
```

### Overs notation
Play Cricket uses decimal overs where the fractional part is balls (0-5):
- `7.0`  = 7 overs
- `7.3`  = 7 overs and 3 balls
- `122.1` = 122 overs and 1 ball

```ts
oversToBalls(o: number): number {
  const whole = Math.floor(o);
  const partial = Math.round((o - whole) * 10);  // 0-5
  return whole * 6 + partial;
}
ballsToOvers(b: number): number {
  return Math.floor(b / 6) + (b % 6) / 10;
}
```

## Combining seasons / teams

When the user selects multiple seasons or teams, derived stats must be
**re-derived**, not averaged:

```ts
combinedRuns      = sum(runs)
combinedInnings   = sum(innings)
combinedNotOuts   = sum(notOuts)
combinedAvg       = combinedRuns / (combinedInnings - combinedNotOuts)
combinedBalls     = sum(balls)
combinedSR        = combinedRuns / combinedBalls * 100
combinedHighScore = max(highScore)
```

For bowling:
```ts
combinedOvers     = ballsToOvers(sum(oversToBalls(o)))   // round-trip
combinedRuns      = sum(runs)
combinedWickets   = sum(wickets)
combinedAvg       = combinedRuns / combinedWickets
combinedSR        = sum(ballsBowled) / combinedWickets
combinedEcon      = combinedRuns / sum(ballsBowled) * 6
bestBowling       = pick highest wickets, lowest runs tiebreaker
```

## "In form" rule (current implementation)

A player is **in form** if, in their last 5 notable performances:
- **Batting**: 2+ scores of 50+, OR any score of 100+
- **Bowling**: any spell of 3+ wickets

We render a 🔥 emoji next to in-form players. Currently fires for ~16% of
players. Make the threshold configurable in `src/lib/form.ts`.

## Fantasy scoring spec (for ClubStats Pro / fantasy tab)

Default rule set (per club configurable):

### Batting
- +1 per run scored
- +1 bonus per boundary (4)
- +2 bonus per six (6)
- +25 for fifty (50–99)
- +50 for hundred (100+)
- –5 for duck if dismissed (0 not out)

### Bowling
- +25 per wicket
- +8 per maiden over
- +50 for 5-wicket haul
- +20 for 4-wicket haul

### Fielding
- +8 per catch
- +10 per stumping
- +6 per run-out

### Captaincy / vice-captaincy (when fantasy league is implemented)
- Captain points × 2
- Vice-captain points × 1.5

### Default config example

```ts
// src/lib/fantasy.ts
export const DEFAULT_SCORING: ScoringRule = {
  batting: { perRun: 1, perFour: 1, perSix: 2, fifty: 25, hundred: 50, duck: -5 },
  bowling: { perWicket: 25, perMaiden: 8, fiveFor: 50, fourFor: 20 },
  fielding: { catch: 8, stumping: 10, runOut: 6 },
};
```

Allow each club to override via a `scoring.json` file in `data/<club>/`.

## Player-of-the-Match heuristics (for awards engine)

For a single match, compute fantasy points per player. The top scorer becomes
"Player of the Match". For a season, aggregate across matches.

## Season-end awards (for the AGM PDF)

- **Most runs** (batting)
- **Highest average** (min 8 innings)
- **Highest individual innings**
- **Most centuries**
- **Most fifties**
- **Strike-rate king** (min 8 innings, SR > 100)
- **Most wickets** (bowling)
- **Best average** (min 50 overs)
- **Best economy** (min 50 overs)
- **Most 5-fers**
- **Most catches** (if scorecard data available)
- **Best maiden of the season** (most economical 5+ over spell)
- **Fantasy points winner** (overall MVP)
