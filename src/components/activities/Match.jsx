import React, { useEffect, useMemo, useState } from 'react';
import { seeded, shuffle, todayKey } from '../../utils/daily';

const POOL = ['🌿', '☕', '🐘', '🎧', '🌦️', '🥭', '🚲', '📻', '🪴', '🧩', '🛶', '🦩'];

export default function Match() {
  const deck = useMemo(() => {
    const rand = seeded(todayKey());
    const picks = shuffle(POOL, rand).slice(0, 6);
    return shuffle([...picks, ...picks], rand).map((face, i) => ({ id: i, face }));
  }, []);

  const [up, setUp] = useState([]);
  const [done, setDone] = useState([]);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const finished = done.length === deck.length;

  useEffect(() => {
    if (!started || finished) return undefined;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500);
    return () => clearInterval(id);
  }, [started, finished]);

  useEffect(() => {
    if (up.length !== 2) return undefined;
    const [a, b] = up;
    const match = deck[a].face === deck[b].face;
    const t = setTimeout(() => {
      if (match) setDone((d) => [...d, a, b]);
      setUp([]);
    }, match ? 260 : 620);
    return () => clearTimeout(t);
  }, [up, deck]);

  const flip = (i) => {
    if (!started) setStarted(Date.now());
    if (up.length === 2 || up.includes(i) || done.includes(i)) return;
    setUp((u) => [...u, i]);
    if (up.length === 1) setMoves((m) => m + 1);
  };

  const restart = () => {
    setUp([]);
    setDone([]);
    setMoves(0);
    setStarted(null);
    setElapsed(0);
  };

  return (
    <div>
      <div className="match-grid">
        {deck.map((card, i) => {
          const shown = up.includes(i) || done.includes(i);
          return (
            <button
              key={card.id}
              className={`card ${done.includes(i) ? 'done' : shown ? 'up' : ''}`}
              onClick={() => flip(i)}
              disabled={done.includes(i)}
              aria-label={shown ? card.face : 'Face-down card'}
            >
              {shown ? card.face : ''}
            </button>
          );
        })}
      </div>

      <p className="match-bar">
        <span>{moves} turns</span>
        <span>{elapsed}s</span>
        <span>{done.length / 2} of 6 pairs</span>
      </p>

      {finished && (
        <p className="breath-caption" style={{ marginTop: 12 }}>
          Done in {moves} turns and {elapsed} seconds. Everyone gets the same cards today, so it is
          worth asking around.
        </p>
      )}

      <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
        <button className="btn btn-quiet" onClick={restart}>
          Shuffle back
        </button>
      </div>
    </div>
  );
}
