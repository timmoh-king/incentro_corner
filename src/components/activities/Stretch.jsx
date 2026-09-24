import React, { useEffect, useRef, useState } from 'react';

const STRETCHES = [
  { key: 'neck', label: 'Neck roll', ms: 15000, note: 'Slowly circle your head, both directions.' },
  { key: 'shoulders', label: 'Shoulder rolls', ms: 15000, note: 'Roll your shoulders up, back, and down.' },
  { key: 'reach', label: 'Reach up', ms: 15000, note: 'Stretch both arms overhead and lean gently side to side.' },
  { key: 'wrists', label: 'Wrist stretch', ms: 15000, note: 'Extend one arm, pull the fingers back gently, then switch.' },
  { key: 'twist', label: 'Seated twist', ms: 15000, note: 'Sitting tall, twist toward one side, then the other.' },
];

const POSES = {
  rest: { arms: [[16, 30], [48, 30]], cls: '' },
  neck: { arms: [[20, 44], [44, 44]], cls: 'sway-head' },
  shoulders: { arms: [[18, 26], [46, 26]], cls: 'sway-shoulders' },
  reach: { arms: [[16, 2], [48, 2]], cls: '' },
  wrists: { arms: [[6, 28], [56, 20]], cls: '' },
  twist: { arms: [[12, 30], [52, 30]], cls: 'sway-twist' },
};

const Figure = ({ poseKey }) => {
  const pose = POSES[poseKey] || POSES.rest;
  return (
    <svg width="110" height="130" viewBox="0 0 64 70" aria-hidden="true" className={pose.cls}>
      <circle cx="32" cy="10" r="7" fill="#fe5000" />
      <line x1="32" y1="17" x2="32" y2="44" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
      <line
        x1="32"
        y1="20"
        x2={pose.arms[0][0]}
        y2={pose.arms[0][1]}
        stroke="#9acaee"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="20"
        x2={pose.arms[1][0]}
        y2={pose.arms[1][1]}
        stroke="#9acaee"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line x1="32" y1="44" x2="22" y2="66" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
      <line x1="32" y1="44" x2="42" y2="66" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
};

export default function Stretch() {
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const [doneAll, setDoneAll] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(() => {
      setI((n) => {
        if (n + 1 >= STRETCHES.length) {
          setRunning(false);
          setDoneAll(true);
          return n;
        }
        return n + 1;
      });
    }, STRETCHES[i].ms);
    return () => clearTimeout(timer.current);
  }, [running, i]);

  const start = () => {
    setI(0);
    setDoneAll(false);
    setRunning(true);
  };

  const stop = () => setRunning(false);

  const current = STRETCHES[i];

  return (
    <div>
      <div className="breath-stage" style={{ minHeight: 220 }}>
        <Figure poseKey={running ? current.key : 'rest'} />
      </div>

      <p className="breath-caption" style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>
        {running ? current.label : doneAll ? 'That is the set' : 'Five easy stretches'}
      </p>
      <p className="breath-caption">
        {running
          ? current.note
          : doneAll
            ? 'Roll through them again whenever your shoulders creep up.'
            : 'About a minute and a bit. Stop any time.'}
      </p>

      {running && (
        <p className="match-bar" style={{ marginTop: 10 }}>
          <span>Stretch {i + 1} of {STRETCHES.length}</span>
        </p>
      )}

      <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
        {!running ? (
          <button className="btn btn-go" onClick={start}>
            {doneAll ? 'Go again' : 'Start stretching'}
          </button>
        ) : (
          <button className="btn btn-quiet" onClick={stop}>
            That is enough
          </button>
        )}
      </div>
    </div>
  );
}
