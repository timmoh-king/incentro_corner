import React, { useState } from 'react';

const ROWS = 5;
const COLS = 6;
const TOTAL = ROWS * COLS;

let audioCtx;

/** Synthesised — a quick downward sine chirp with a fast decay, no audio file needed. */
const playPop = () => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    /* no Web Audio support — popping still works, just silently */
  }
};

export default function Bubble() {
  const [popped, setPopped] = useState(() => new Set());

  const allPopped = popped.size === TOTAL;

  const pop = (i) => {
    if (popped.has(i)) return;
    playPop();
    setPopped((p) => new Set(p).add(i));
  };

  const refill = () => setPopped(new Set());

  return (
    <div>
      <p className="breath-caption" style={{ marginBottom: 14 }}>
        Pop them all. There is no wrong way to do this.
      </p>

      <div className="bubble-grid">
        {Array.from({ length: TOTAL }, (_, i) => (
          <button
            key={i}
            className={`bubble ${popped.has(i) ? 'popped' : ''}`}
            onClick={() => pop(i)}
            aria-label={popped.has(i) ? 'Popped bubble' : 'Bubble'}
            aria-pressed={popped.has(i)}
          />
        ))}
      </div>

      <p className="match-bar">
        <span>{popped.size} of {TOTAL} popped</span>
      </p>

      {allPopped && (
        <p className="breath-caption" style={{ marginTop: 4 }}>
          All popped. Nicely done.
        </p>
      )}

      <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
        <button className="btn btn-quiet" onClick={refill} disabled={popped.size === 0}>
          Fresh sheet
        </button>
      </div>
    </div>
  );
}
