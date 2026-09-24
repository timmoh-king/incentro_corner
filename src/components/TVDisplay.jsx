import React, { useEffect, useState } from 'react';
import { Note } from './Wall';
import { connectBoard, getMe, getNotes } from '../services/monday';
import { fetchLeaderboard, fetchMergedLeaderboard } from '../services/heytaco';

const NOTES_REFRESH_MS = 15_000; // the TV is a separate tab/device, so a fresh note only shows up once this polls again
const ROTATE_MS = 15_000; // how long each leaderboard type stays on screen
const RELOAD_MS = 30 * 60_000; // an unattended kiosk tab benefits from a periodic hard refresh
const NOTES_SHOWN = 4;
const RANKS_SHOWN = 10;

const TIMEFRAME = import.meta.env.VITE_HEYTACO_LEADERBOARD_TIMEFRAME || 'week';
const TIMEFRAME_LABELS = {
  today: 'today',
  week: 'this week',
  month: 'this month',
  year: 'this year',
  alltime: 'all time',
};

// No input on a TV, so the leaderboard types cycle instead of tabbing.
// HeyTaco's API restricts type=combined to timeframe alltime/year (a month
// request 400s with invalid_timeframe), so there's no "combined this month"
// from their API directly — that slide merges given + received itself
// (see fetchMergedLeaderboard in services/heytaco.js).
const LEADERBOARD_TYPES = [
  { key: 'given', type: 'given', label: 'Top taco-givers', timeframe: TIMEFRAME },
  { key: 'received', type: 'received', label: 'Top taco-receivers', timeframe: TIMEFRAME },
  { key: 'combined-month', label: 'Combined (given + received)', timeframe: 'month', merged: true },
  { key: 'combined-alltime', type: 'combined', label: 'Combined (given + received)', timeframe: 'alltime' },
];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LeaderboardRow({ row, index }) {
  const medal = MEDALS[row.rank];
  return (
    <li className={`tv-lb-row${medal ? ' top' : ''}`} style={{ animationDelay: `${index * 60}ms` }}>
      <span className="tv-lb-rank">{medal || row.rank}</span>
      <span className="tv-lb-avatar" aria-hidden="true">
        {row.avatar ? <img src={row.avatar} alt="" /> : row.name.slice(0, 1)}
      </span>
      <span className="tv-lb-name">{row.name}</span>
      <span className="tv-lb-count">🌮 {row.count}</span>
    </li>
  );
}

export default function TVDisplay() {
  const [notes, setNotes] = useState([]);
  const [rows, setRows] = useState([]);
  const [lbError, setLbError] = useState('');
  const [typeIndex, setTypeIndex] = useState(0);
  const now = useClock();
  const board = LEADERBOARD_TYPES[typeIndex];

  useEffect(() => {
    let dead = false;
    const loadWall = async () => {
      try {
        await getMe();
        await connectBoard();
        const fresh = await getNotes();
        if (!dead) setNotes(fresh.slice(0, NOTES_SHOWN));
      } catch {
        /* keep showing whatever was already on screen */
      }
    };
    loadWall();
    const id = setInterval(loadWall, NOTES_REFRESH_MS);
    return () => {
      dead = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTypeIndex((i) => (i + 1) % LEADERBOARD_TYPES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let dead = false;
    const loadBoard = async () => {
      try {
        const data = board.merged
          ? await fetchMergedLeaderboard({ timeframe: board.timeframe })
          : await fetchLeaderboard({ type: board.type, timeframe: board.timeframe });
        if (!dead) {
          setRows(data.slice(0, RANKS_SHOWN));
          setLbError('');
        }
      } catch (err) {
        if (!dead) setLbError(err.message || 'Could not reach HeyTaco.');
      }
    };
    loadBoard();
    return () => {
      dead = true;
    };
  }, [board.key]);

  useEffect(() => {
    const id = setTimeout(() => window.location.reload(), RELOAD_MS);
    return () => clearTimeout(id);
  }, []);

  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="tv">
      <header className="tv-bar">
        <h1 className="tv-mark">Incentro Corner</h1>
        <div className="tv-clock-wrap">
          <span className="tv-live-dot" aria-hidden="true" />
          <span className="tv-clock">{timeLabel}</span>
        </div>
      </header>

      <main className="tv-grid">
        <section className="tv-panel tv-lb">
          <div className="tv-panel-accent" aria-hidden="true" />
          <h2>🌮 HeyTaco leaderboard</h2>
          <div className="tv-lb-body" key={board.key}>
            <p className="tv-sub">
              {board.label} {TIMEFRAME_LABELS[board.timeframe] || board.timeframe}, via HeyTaco
            </p>
            {lbError && <p className="tv-error">{lbError}</p>}
            {!lbError && !rows.length && (
              <p className="tv-lb-empty">
                <span aria-hidden="true">😢</span> No tacos{' '}
                {board.type === 'received' ? 'received' : board.type === 'given' ? 'given' : 'given or received'}{' '}
                {TIMEFRAME_LABELS[board.timeframe] || board.timeframe} yet.
              </p>
            )}
            {!lbError && !!rows.length && (
              <ol className="tv-lb-list">
                {rows.map((row, i) => (
                  <LeaderboardRow key={`${row.rank}-${row.name}`} row={row} index={i} />
                ))}
              </ol>
            )}
          </div>
          <div className="tv-lb-dots" aria-hidden="true">
            {LEADERBOARD_TYPES.map((b, i) => (
              <span
                key={b.key}
                className={`tv-lb-dot${i < typeIndex ? ' done' : ''}${i === typeIndex ? ' current' : ''}`}
              >
                {i === typeIndex && (
                  <span
                    key={board.key}
                    className="tv-lb-dot-fill"
                    style={{ animationDuration: `${ROTATE_MS}ms` }}
                  />
                )}
              </span>
            ))}
          </div>
        </section>

        <section className="tv-panel tv-wall">
          <div className="tv-panel-accent" aria-hidden="true" />
          <h2>The wall</h2>
          <p className="tv-sub">Latest 4 thank-you notes, quotes, or fun facts company-wide</p>
          <div className="tv-notes">
            {notes.map((n, i) => (
              <div key={n.id} className="tv-note-in" style={{ animationDelay: `${i * 80}ms` }}>
                <Note note={n} readOnly />
              </div>
            ))}
            {!notes.length && <p className="tv-empty">The wall is quiet right now.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
