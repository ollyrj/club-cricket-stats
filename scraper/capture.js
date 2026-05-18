/**
 * ClubStats — Reference capture script (browser-based)
 *
 * This is the JavaScript that was run in-browser (from the Sunbury/Roe Green
 * Play Cricket Statistics page, while signed in) to capture the data for the
 * current prototypes.
 *
 * Port this to Playwright + TypeScript in `scraper/capture.ts` for production.
 * The HTML parsing logic translates 1:1 — only the auth and fetch contexts
 * change.
 *
 * Usage in a logged-in browser console:
 *   1. Open https://<subdomain>.play-cricket.com/Statistics
 *   2. Open DevTools → Console
 *   3. Paste this file and call: captureClub({ club, teams, seasons })
 *
 * For the production scraper, see docs/scraper-notes.md for the Play Cricket
 * quirks you must know about.
 */

// ============================================================================
// CONFIG
// ============================================================================

const SEASON_IDS = {
  '2026': '259', '2025': '258', '2024': '257',
  '2023': '256', '2022': '255', '2021': '222',
  '2020': '77',
};

const GAME_TYPES = [
  ['League',   '194'],
  ['Cup',      '195'],
  ['Friendly', '196'],
  ['All',      'all'],
];

const RULES_STANDARD = '179';
const CATEGORY_SENIOR = '1';

// ============================================================================
// PARSERS
// ============================================================================

function parseBattingTable(doc) {
  const t = Array.from(doc.querySelectorAll('table')).find(t => {
    const h = Array.from(t.rows[0]?.cells || []).map(c => c.innerText.trim());
    return h.includes('RUNS') && h.includes('AVG');
  });
  if (!t) return [];
  const rows = [];
  for (let i = 1; i < t.rows.length; i++) {
    const c = Array.from(t.rows[i].cells).map(x => x.innerText.trim());
    if (c.length >= 11 && /^\d+$/.test(c[0])) {
      rows.push([
        +c[0], c[1], +c[2], +c[3], +c[4], +c[5],
        c[6], parseFloat(c[7]) || 0, +c[8], +c[9], parseFloat(c[10]) || 0,
      ]);
    }
  }
  return rows;
}

function parseBowlingTable(doc) {
  const t = Array.from(doc.querySelectorAll('table')).find(t => {
    const h = Array.from(t.rows[0]?.cells || []).map(c => c.innerText.trim());
    return h.includes('WICKETS') && h.includes('OVERS');
  });
  if (!t) return [];
  const rows = [];
  for (let i = 1; i < t.rows.length; i++) {
    const c = Array.from(t.rows[i].cells).map(x => x.innerText.trim());
    if (c.length >= 11 && /^\d+$/.test(c[0])) {
      rows.push([
        +c[0], c[1], parseFloat(c[2]) || 0, +c[3] || 0, +c[4] || 0, +c[5] || 0,
        c[6], +c[7] || 0, parseFloat(c[8]) || 0,
        parseFloat(c[9]) || 0, parseFloat(c[10]) || 0,
      ]);
    }
  }
  return rows;
}

function parseTopBatting(doc) {
  const t = Array.from(doc.querySelectorAll('table')).find(t => {
    const h = Array.from(t.rows[0]?.cells || []).map(c => c.innerText.trim());
    return h.includes('SCORE') && h.includes('NAME');
  });
  if (!t) return [];
  const rows = [];
  for (let i = 1; i < t.rows.length; i++) {
    const c = Array.from(t.rows[i].cells).map(x => x.innerText.trim());
    if (c.length >= 4 && /^\d/.test(c[0])) {
      rows.push([c[0], c[1], cleanMatch(c[2]), c[3]]);
    }
  }
  return rows;
}

function parseTopBowling(doc) {
  const t = Array.from(doc.querySelectorAll('table')).find(t => {
    const h = Array.from(t.rows[0]?.cells || []).map(c => c.innerText.trim());
    return h.includes('NAME') && h.includes('DATE') &&
           (h.includes('WICKET') || h.includes('FIGURES'));
  });
  if (!t) return [];
  const rows = [];
  for (let i = 1; i < t.rows.length; i++) {
    const c = Array.from(t.rows[i].cells).map(x => x.innerText.trim());
    if (c.length >= 4 && /^\d+\s*\/\s*\d+/.test(c[0])) {
      rows.push([c[0], c[1], cleanMatch(c[2]), c[3]]);
    }
  }
  return rows;
}

/**
 * Clean up the noisy "match" cell. Play Cricket renders it with embedded
 * line breaks and double-spaces.
 */
function cleanMatch(s) {
  return s
    .replace(/[\t\xa0\n]+/g, ' ')
    .replace(/  +/g, ' ')
    .replace(/ +Vs +/g, ' Vs ')
    .trim();
}

// ============================================================================
// FETCHERS
// ============================================================================

const BASE = '/Statistics';

function buildUrl({ tab, subTab, season, teamId, gameType, atLeast = 1 }) {
  const params = new URLSearchParams({
    tab,
    sub_tab: subTab,
    per_page: '500',
    rule_type_id: RULES_STANDARD,
    season,
    order_by: 'total_runs',
    category_id: CATEGORY_SENIOR,
    gender_id: 'all',
    game_type: gameType,
    team_id: teamId,
    atleast: String(atLeast),
  });
  return `${BASE}?${params.toString()}`;
}

async function fetchAndParse(url, parser) {
  const res = await fetch(url, { credentials: 'include' });
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return parser(doc);
}

// ============================================================================
// MAIN CAPTURE LOOP
// ============================================================================

/**
 * Capture a club's data across the requested seasons.
 *
 * @param {{club: string, teams: Record<string,string>, seasons: string[]}} cfg
 *   - club:     human-readable label, used in output
 *   - teams:    map of team label -> Play Cricket team_id
 *               e.g. { '1st XI': '29506', '2nd XI': '29507', All: 'all' }
 *   - seasons:  array of years to capture, e.g. ['2023','2024','2025','2026']
 *
 * @returns {Promise<DashboardData>}
 */
async function captureClub({ club, teams, seasons }) {
  const teamEntries = Object.entries(teams);          // [['All','all'], ['1st XI','29506'], ...]
  const out = {
    seasons,
    gameTypes: GAME_TYPES.map(g => g[0]),
    teams:     teamEntries.map(([label]) => label),
    cols:      ['rank','player','games','inns','no','runs','hs','avg','fifties','hundreds','sr'],
    bowlCols:  ['rank','player','overs','maidens','runs','wickets','best','fiveW','econ','sr','avg'],
    data:      {},
    playerPerfs: { batting: {}, bowling: {} },
    meta: {
      club,
      source:     `https://${location.host}/Statistics`,
      capturedAt: new Date().toISOString().slice(0, 7),  // 'YYYY-MM'
      rules:      'Standard',
      category:   'Senior',
    },
  };

  for (const year of seasons) {
    const seasonId = SEASON_IDS[year];
    if (!seasonId) {
      console.warn(`Unknown season ${year}, skipping`);
      continue;
    }
    out.data[year] = { bat: {}, tp: {}, bowl: {}, bowlTp: {} };

    for (const [gtLabel, gtVal] of GAME_TYPES) {
      out.data[year].bat[gtLabel]    = {};
      out.data[year].tp[gtLabel]     = {};
      out.data[year].bowl[gtLabel]   = {};
      out.data[year].bowlTp[gtLabel] = {};

      for (const [teamLabel, teamId] of teamEntries) {
        const baseArgs = { season: seasonId, teamId, gameType: gtVal };

        out.data[year].bat[gtLabel][teamLabel]    = await fetchAndParse(
          buildUrl({ ...baseArgs, tab: 'Batting', subTab: 'Standard' }),
          parseBattingTable,
        );
        out.data[year].tp[gtLabel][teamLabel]     = await fetchAndParse(
          buildUrl({ ...baseArgs, tab: 'Batting', subTab: 'Top%20Performance' }),
          parseTopBatting,
        );
        out.data[year].bowl[gtLabel][teamLabel]   = await fetchAndParse(
          buildUrl({ ...baseArgs, tab: 'Bowling', subTab: 'Standard' }),
          parseBowlingTable,
        );
        out.data[year].bowlTp[gtLabel][teamLabel] = await fetchAndParse(
          buildUrl({ ...baseArgs, tab: 'Bowling', subTab: 'Top%20Performance' }),
          parseTopBowling,
        );
      }
    }

    console.log(`${year} captured`);
  }

  // Build the playerPerfs map from the Top Performance lists
  out.playerPerfs = buildPlayerPerfs(out);

  return out;
}

/**
 * Walk every team's Top Performance list and build a per-player flat list of
 * notable performances. The dashboard uses this for the "last 5" expand row
 * and the in-form fire emoji.
 */
function buildPlayerPerfs(data) {
  const seasons   = data.seasons;
  const gameTypes = ['League','Cup','Friendly'];      // skip 'All' to avoid duplication
  const teams     = data.teams.filter(t => t !== 'All');

  const byPlayer = { batting: {}, bowling: {} };
  const seen = new Set();

  function ingest(kind, key) {
    for (const season of seasons) {
      for (const gt of gameTypes) {
        for (const team of teams) {
          const rows = data.data[season]?.[key]?.[gt]?.[team] || [];
          for (const r of rows) {
            const [score, player, match, dateLabel] = r;
            const k = `${player}|${dateLabel}|${score}|${team}`;
            if (seen.has(k)) continue;
            seen.add(k);

            // Parse date — accept '12 Jul 2025' format
            const date = parseDate(dateLabel);
            const opposition = extractOpposition(match);

            (byPlayer[kind][player] ||= []).push({
              date, dateLabel, team, season, gt, score, opposition,
            });
          }
        }
      }
    }
    // Sort each player's perfs by date desc
    for (const p of Object.keys(byPlayer[kind])) {
      byPlayer[kind][p].sort((a, b) => b.date.localeCompare(a.date));
    }
  }

  ingest('batting', 'tp');
  ingest('bowling', 'bowlTp');
  return byPlayer;
}

function parseDate(label) {
  // '12 Jul 2025' -> '2025-07-12'
  const m = label.match(/^(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})$/);
  if (!m) return label;  // fallback
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
                   Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  return `${m[3]}-${months[m[2]]}-${m[1].padStart(2,'0')}`;
}

function extractOpposition(match) {
  if (!match.includes('Vs')) return '';
  for (const part of match.split(' Vs ').map(s => s.trim())) {
    // Heuristic: opposition is the side that's NOT us. We don't know our
    // own club name from here, so the production scraper should pass it in.
    // In the prototype we filtered by "doesn't contain 'Sunbury'" — make
    // this configurable per club.
    if (!part.match(/your_club_name_here/i)) return part;
  }
  return '';
}

// ============================================================================
// EXAMPLE INVOCATION
// ============================================================================

/*
// Sunbury CC team IDs (live in May 2026)
const SUNBURY = {
  'All':     'all',
  '1st XI':  '29506',
  '2nd XI':  '29507',
  '3rd XI':  '29508',
  '4th XI':  '29509',
  '5th XI':  '268424',
  '6th XI':  '269501',
};

// Roe Green CC team IDs
const ROE_GREEN = {
  'All':     'all',
  '1st XI':  '16528',
  '2nd XI':  '361531',
  '3rd XI':  '361704',
};

const data = await captureClub({
  club:    'Sunbury CC',
  teams:   SUNBURY,
  seasons: ['2023', '2024', '2025', '2026'],
});
console.log(JSON.stringify(data));
*/
