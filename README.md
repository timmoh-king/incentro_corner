# Breather

A quiet corner inside monday.com. People thank each other on a shared wall, and
take a couple of minutes away from the boards when their head is full.

Built as a **custom object**, so it gets its own full page in the left-hand menu
rather than sitting on a board.

---

## What's in it

**The wall.** Thank-you notes pinned up as paper cards, newest first, coloured by
what kind of thank-you it is. Anyone can add a clap to a note. Every note is a
real item on a monday board, so it is searchable and nothing is locked inside
this app.

**Take five.** Three small things, each finishable in about two minutes: box
breathing that follows a circle, a memory game that is the same for everyone in
the company each day, and a doodle pad with a daily prompt. Nothing is recorded.

**For you.** The notes people have put up for you, one line of encouragement, and
the setting that keeps you off the wall if you would rather not be named.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:8311
```

Outside monday it runs on sample data — six notes from a made-up team. The header
shows a *Sample data* badge whenever that is happening, so you can look at the
whole thing before connecting a board.

## Connecting your board

1. Create a board called **Team Kudos** with these columns:

   | Column title | Type |
   | --- | --- |
   | To | People |
   | From | People |
   | Message | Long text |
   | Category | Status |
   | Cheers | Numbers |

2. Set the Category column's labels to exactly:
   `Helped me out`, `Went above and beyond`, `Made my day`, `Quietly brilliant`.
   To change them, edit `CATEGORIES` in `src/config/board.js` — each one carries
   the colour of the note.

3. Copy `.env.example` to `.env` and paste the board id from its URL:

   ```
   VITE_KUDOS_BOARD_ID=1234567890
   ```

You do not need to find any column ids. The app reads the board's schema on
startup and matches columns by title. If a column is missing it falls back to
sample data rather than failing silently.

## Running outside monday

Inside monday's iframe, the SDK authenticates automatically via the logged-in
session — nothing to configure. Outside it (`npm run dev`, or the `?tv=1`
display open in a plain browser tab) there's no iframe to authenticate
through, so `getMe()`/`getPeople()`/notes all fall back to sample data unless
`.env` has:

```
VITE_MONDAY_API_TOKEN=your-token-here
```

Get one from your monday profile (Admin → API). It needs at least
`users:read` (for the "Pick a colleague" dropdown) and `boards:read` (for the
wall's notes). Same caveat as the HeyTaco key: this is a Vite env var, so it
ships inside the built JS bundle — anyone with dev tools on that build can
read it out. Fine for local dev; don't ship a build with this set to anywhere
public.

## TV mode

Visit the app with `?tv=1` (e.g. `http://localhost:8311/?tv=1`, or your
deployed URL + `?tv=1`) for a full-screen, read-only display meant for an
office TV — no tabs, no composer, nothing to click. Point a browser tab at it
and leave it open; it refreshes itself and does a full page reload every 30
minutes to stay fresh over a long unattended run.

It's two panels, deliberately kept separate:

- **The wall** — the 4 most recent thank-you notes from this app's own board,
  refreshed every 15 seconds. Read-only: no cheer counts, no totals, same as the
  design decision below.
- **HeyTaco leaderboard** — pulled live from HeyTaco's API
  (https://api.heytaco.com/docs/). This is HeyTaco's own leaderboard concept,
  not breather's — it stays a distinct, clearly-labelled panel rather than
  being folded into the wall or its data. Since there's no input on a TV,
  it automatically cycles through all three of HeyTaco's leaderboard types —
  top givers, top receivers, combined this month, combined all time — 15
  seconds each, with a dot
  indicator showing which one is on screen. Each type re-fetches fresh data
  the moment it comes on screen.

Because the TV panel needs to be logged into monday to see real notes (same
auth as normal use), the simplest setup is a browser tab on the TV that's
signed into monday and open to this app's page with `?tv=1` appended.

To turn on the leaderboard panel, copy an API key from HeyTaco (Profile → API
keys) into `.env`:

```
VITE_HEYTACO_API_KEY=your-key-here
VITE_HEYTACO_LEADERBOARD_TIMEFRAME=week  # today | week | month | year | alltime
```

Without a key it shows sample standings, same pattern as the board falling
back to sample notes. The timeframe above only applies to the given/received
leaderboards — HeyTaco's API rejects `type=combined` with anything shorter
than a year (`invalid_timeframe`), so the combined view always requests
`alltime` regardless of this setting.

**This has to go through a proxy — it's not optional.** HeyTaco's API sends
no `Access-Control-Allow-Origin` header, so a browser calling
`api.heytaco.com` directly is blocked by CORS, in dev and once deployed
alike. `heytaco.js` calls a same-origin path, `/api/heytaco/...`, instead —
`vite.config.js` proxies that to HeyTaco for local dev (`npm run dev`), but
whatever hosts the production build needs the same route implemented
server-side (a small serverless function is the natural fit) before the TV
build will ever load a real leaderboard.

That proxy is also where the API key should end up living. Right now it's a
Vite env var, which ships inside the built JS bundle — anyone who opens dev
tools on the TV's browser can read it out. Fine while it's only reachable via
the dev proxy on your machine; once a production proxy exists, move the key
into that proxy's server-side environment and drop it from `.env`/the
client bundle entirely.

HeyTaco's docs describe the leaderboard response as "team members ranked by
taco activity" without listing exact field names, so `heytaco.js` was built
against a set of likely candidates and then confirmed against a real
response: each row is `{ rank, user_id, name, avatar_url, total }` inside a
`{ ..., data: [...] }` envelope. The candidate lists stay in place as a
fallback in case HeyTaco varies the shape across account types.

## Installing it in monday

1. Profile picture → **Developers** → **Create app**.
2. **Build → Features → Create feature → Custom Object**.
3. Scopes: `me:read`, `users:read`, `boards:read`, `boards:write`,
   `storage:read`, `storage:write`.
4. For development, tunnel your dev server:

   ```bash
   npm i -g @mondaycom/apps-cli
   mapps tunnel:create -p 8311
   ```

5. To ship it:

   ```bash
   npm run build
   mapps code:push -i <app-version-id> -d ./build
   ```

The quiet list (people who have opted out of being named) is kept in monday's
instance storage, not on a board, so nobody can browse it.

---

## Design decisions worth keeping

These are deliberate. Each one is easy to undo and each one would change what the
app feels like to work under.

**No counts per person, no leaderboard, no "most thanked".** The moment
recognition becomes a number, quiet people lose and it turns into another
performance surface. The wall shows notes, not totals. The only number anywhere
is claps on an individual note.

**Named, never anonymous.** Anonymous praise reads as strange and, at 35 people,
is guessable anyway. Anonymity belongs in a concerns channel, which is a
different tool needing different care.

**Nothing logs who used Take five.** No timers reported, no participation data,
nothing a manager could pull. If a break can be observed it stops being a break.

**Anyone can opt out of the wall.** Some people genuinely dislike public praise.
Turning it on removes them from the recipient picker, and nobody is told.

**No nudges, streaks or reminders.** The app never asks anyone to thank someone,
and never tells you that you have not. It waits to be visited.

**The break ends quietly.** The breathing exercise says *That is enough* rather
than sending you back to work.

## Layout

```
src/
  config/board.js              board id, column titles, categories and colours
  services/monday.js           API calls, quiet list, sample data
  services/heytaco.js          HeyTaco leaderboard client, for TV mode only
  utils/daily.js               date-seeded helpers so the puzzle matches company-wide
  components/
    Wall.jsx                   the notes and the composer
    TVDisplay.jsx              ?tv=1 — wall + HeyTaco leaderboard, side by side
    TakeFive.jsx               activity shelf and focus mode
    ForYou.jsx                 your notes, encouragement, opt-out
    activities/Breathe.jsx     box breathing
    activities/Match.jsx       daily pairs
    activities/Doodle.jsx      scribble pad
    ui.jsx                     toasts, avatar, loading
  styles/app.css               all styles and the colour tokens
```
# incentro_corner
