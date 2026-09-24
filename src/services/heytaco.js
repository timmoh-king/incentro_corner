/**
 * Thin client for HeyTaco's leaderboard API (https://api.heytaco.com/docs/).
 *
 * Deliberately separate from services/monday.js. Breather's own data (the
 * wall) never gets counts or rankings — see the "design decisions worth
 * keeping" note in the README. HeyTaco's leaderboard is a different product
 * with its own leaderboard concept; it stays in its own panel, never merged
 * into the wall's data.
 */

/**
 * HeyTaco's API sends no Access-Control-Allow-Origin header, so a browser
 * fetch straight to api.heytaco.com is blocked by CORS — this isn't
 * environment-specific, it fails the same way in dev and once deployed.
 * `/api/heytaco` is a same-origin path that something server-side has to
 * forward: vite.config.js proxies it for local dev. Whatever hosts the
 * production build (monday, or wherever this gets deployed) needs the same
 * proxy route implemented server-side — see README "TV mode".
 */
const BASE_URL = '/api/heytaco';
const API_KEY = import.meta.env.VITE_HEYTACO_API_KEY || '';
const TYPE = import.meta.env.VITE_HEYTACO_LEADERBOARD_TYPE || 'given';
const TIMEFRAME = import.meta.env.VITE_HEYTACO_LEADERBOARD_TIMEFRAME || 'week';

export const heytacoState = { demo: !API_KEY };

const pick = (obj, keys, fallback) => {
  const found = keys.find((k) => obj?.[k] !== undefined);
  return found ? obj[found] : fallback;
};

/**
 * Confirmed against a real GET /leaderboard response: envelope is
 * { object, type, timeframe, start_date, end_date, total_results, data: [...] },
 * each row is { rank, user_id, name, avatar_url, total }. The fallback keys
 * stay as a safety net in case HeyTaco varies the shape across account types.
 */
const normaliseRow = (row, i) => ({
  rank: pick(row, ['rank', 'position'], i + 1),
  id: pick(row, ['user_id', 'id'], null),
  name: pick(row, ['name', 'display_name', 'real_name', 'user_name', 'username'], 'Someone'),
  avatar: pick(row, ['avatar_url', 'avatar', 'image', 'image_url', 'photo'], ''),
  count: Number(pick(row, ['total', 'count', 'tacos', 'score'], 0)),
});

export async function fetchLeaderboard({ type = TYPE, timeframe = TIMEFRAME } = {}) {
  if (!API_KEY) return DEMO_LEADERBOARD;

  const url = `${BASE_URL}/leaderboard?type=${encodeURIComponent(type)}&timeframe=${encodeURIComponent(timeframe)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
  if (!res.ok) throw new Error(`HeyTaco leaderboard request failed (${res.status})`);

  const data = await res.json();
  const rows = data?.leaderboard || data?.data || data?.results || (Array.isArray(data) ? data : []);
  return rows.map(normaliseRow).sort((a, b) => a.rank - b.rank);
}

/**
 * HeyTaco's own type=combined only accepts timeframe alltime/year — a month
 * request 400s with `invalid_timeframe`. There's no monthly "combined" from
 * their API, so this fetches given + received for the month separately and
 * sums each person's two counts client-side, then re-ranks by that total.
 */
export async function fetchMergedLeaderboard({ timeframe = 'month' } = {}) {
  if (!API_KEY) return DEMO_LEADERBOARD;

  const [given, received] = await Promise.all([
    fetchLeaderboard({ type: 'given', timeframe }),
    fetchLeaderboard({ type: 'received', timeframe }),
  ]);

  const totals = new Map();
  [...given, ...received].forEach((row) => {
    const key = row.id ?? row.name;
    const existing = totals.get(key) || { id: row.id, name: row.name, avatar: row.avatar, count: 0 };
    existing.count += row.count;
    if (!existing.avatar && row.avatar) existing.avatar = row.avatar;
    totals.set(key, existing);
  });

  return [...totals.values()]
    .sort((a, b) => b.count - a.count)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

const DEMO_LEADERBOARD = [
  { rank: 1, name: 'Grace Wanjiru', avatar: '', count: 14 },
  { rank: 2, name: 'Peter Mwangi', avatar: '', count: 11 },
  { rank: 3, name: 'Aisha Noor', avatar: '', count: 9 },
  { rank: 4, name: 'Brian Otieno', avatar: '', count: 7 },
  { rank: 5, name: 'Timothy Kariuki', avatar: '', count: 6 },
];
