import React, { useEffect, useRef, useState } from 'react';

/** Box breathing: in 4, hold 4, out 4, hold 4. Six rounds is about a minute and a half. */
const PHASES = [
  { key: 'in', label: 'Breathe in', ms: 4000, cls: 'in' },
  { key: 'hold', label: 'Hold', ms: 4000, cls: 'hold' },
  { key: 'out', label: 'Breathe out', ms: 4000, cls: 'out' },
  { key: 'rest', label: 'Hold', ms: 4000, cls: 'holdlow' },
];

export default function Breathe() {
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const [rounds, setRounds] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(() => {
      setI((n) => {
        const next = (n + 1) % PHASES.length;
        if (next === 0) setRounds((r) => r + 1);
        return next;
      });
    }, PHASES[i].ms);
    return () => clearTimeout(timer.current);
  }, [running, i]);

  const phase = PHASES[i];

  const reset = () => {
    setRunning(false);
    setI(0);
    setRounds(0);
  };

  return (
    <div>
      <div className="breath-stage">
        <div className={`breath-ring ${running ? phase.cls : ''}`}>
          {running ? phase.label : 'Ready'}
        </div>
      </div>

      <p className="breath-caption">
        {running
          ? `Round ${rounds + 1}. Stop whenever you like.`
          : 'In for four, hold for four, out for four, hold for four.'}
      </p>

      <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
        {!running ? (
          <button className="btn btn-go" onClick={() => setRunning(true)}>
            Start breathing
          </button>
        ) : (
          <button className="btn btn-quiet" onClick={reset}>
            That is enough
          </button>
        )}
      </div>
    </div>
  );
}
