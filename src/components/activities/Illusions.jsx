import React, { useEffect, useRef, useState } from 'react';

const Wheel = () => <div className="illusion-wheel" aria-hidden="true" />;

const NECKER_POINTS = [
  [30, 10],
  [90, 10],
  [90, 70],
  [30, 70],
  [10, 30],
  [70, 30],
  [70, 90],
  [10, 90],
];

function NeckerCube() {
  const [front, setFront] = useState('back');

  const toggle = () => setFront((f) => (f === 'back' ? 'front' : 'back'));

  return (
    <div className="necker-wrap">
      <svg
        width="240"
        height="240"
        viewBox="0 0 100 100"
        className="necker-svg"
        role="button"
        tabIndex={0}
        aria-label="Toggle which face of the cube looks closest"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <polygon
          points="30,10 90,10 90,70 30,70"
          fill="none"
          stroke="#000"
          strokeWidth={front === 'back' ? 3.4 : 1.2}
        />
        <polygon
          points="10,30 70,30 70,90 10,90"
          fill="none"
          stroke="#000"
          strokeWidth={front === 'front' ? 3.4 : 1.2}
        />
        <line x1="30" y1="10" x2="10" y2="30" stroke="#000" strokeWidth="1.2" />
        <line x1="90" y1="10" x2="70" y2="30" stroke="#000" strokeWidth="1.2" />
        <line x1="90" y1="70" x2="70" y2="90" stroke="#000" strokeWidth="1.2" />
        <line x1="30" y1="70" x2="10" y2="90" stroke="#000" strokeWidth="1.2" />
        {NECKER_POINTS.map(([x, y], idx) => (
          <circle key={idx} cx={x} cy={y} r="2.8" fill="#fe5000" />
        ))}
      </svg>
    </div>
  );
}

const HermannGrid = () => (
  <div className="illusion-grid" aria-hidden="true">
    {Array.from({ length: 64 }, (_, i) => (
      <div key={i} />
    ))}
  </div>
);

const AFTER_COLORS = ['#fe5000', '#005544', '#6e222b', '#9acaee'];
const STARE_SECONDS = 20;

function Afterimage() {
  const [phase, setPhase] = useState('idle');
  const [count, setCount] = useState(STARE_SECONDS);
  const [colorIndex, setColorIndex] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (phase !== 'staring') return undefined;
    if (count === 0) {
      setPhase('blank');
      return undefined;
    }
    timer.current = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer.current);
  }, [phase, count]);

  const start = () => {
    setCount(STARE_SECONDS);
    setPhase('staring');
  };

  const again = () => {
    setColorIndex((idx) => (idx + 1) % AFTER_COLORS.length);
    setPhase('idle');
  };

  return (
    <div className="illusion-after">
      {phase === 'idle' && (
        <button className="btn btn-go" onClick={start}>
          Begin
        </button>
      )}

      {phase === 'staring' && (
        <>
          <div className="after-target" style={{ background: AFTER_COLORS[colorIndex] }}>
            <span className="after-dot" />
          </div>
          <p className="breath-caption">
            Don&rsquo;t look away yet, and try not to blink much. {count}s
          </p>
        </>
      )}

      {phase === 'blank' && (
        <>
          <div className="after-blank">
            <span className="after-dot" />
          </div>
          <p className="breath-caption">Look at this dot instead. Give it a moment to show up.</p>
          <button className="btn btn-quiet" onClick={again}>
            Try another colour
          </button>
        </>
      )}
    </div>
  );
}

const ILLUSIONS = [
  {
    key: 'wheel',
    title: 'Drifting wheel',
    note: 'Let your eyes soften and just watch it turn. Nothing to track or solve.',
    render: () => (
      <div className="illusion-stage">
        <Wheel />
      </div>
    ),
  },
  {
    key: 'grid',
    title: 'Ghost dots',
    note: 'Look near the middle of the grid. Grey dots seem to flicker where you are not quite looking.',
    render: () => (
      <div className="illusion-stage">
        <HermannGrid />
      </div>
    ),
  },
  {
    key: 'cube',
    title: 'Necker cube',
    note: 'Pick one dot and hold your gaze there without moving your eyes. After a while the whole cube should flip inside out on its own. Click it for a nudge in the meantime.',
    render: () => (
      <div className="illusion-stage">
        <NeckerCube />
      </div>
    ),
  },
  {
    key: 'after',
    title: 'Afterimage',
    note: 'Stare at the dot for the full twenty seconds without looking away, then hold your gaze on the second dot.',
    render: () => <Afterimage />,
  },
];

export default function Illusions() {
  const [i, setI] = useState(0);
  const current = ILLUSIONS[i];

  return (
    <div>
      <p className="breath-caption" style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>
        {current.title}
      </p>
      <p className="breath-caption" style={{ marginBottom: 6 }}>
        {current.note}
      </p>

      {current.render()}

      <div className="chips" style={{ justifyContent: 'center', marginTop: 18 }}>
        {ILLUSIONS.map((item, idx) => (
          <button key={item.key} className="chip" aria-pressed={idx === i} onClick={() => setI(idx)}>
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
