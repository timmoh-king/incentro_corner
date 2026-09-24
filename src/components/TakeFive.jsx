import React, { useState } from 'react';
import Breathe from './activities/Breathe';
import Match from './activities/Match';
import Doodle from './activities/Doodle';
import Bubble from './activities/Bubble';
import Stretch from './activities/Stretch';
import Illusions from './activities/Illusions';
import GoodThing from './activities/GoodThing';

const RingArt = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="27" fill="none" stroke="#9acaee" strokeWidth="7" />
    <circle cx="32" cy="32" r="14" fill="#005544" />
  </svg>
);

const GridArt = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <rect
          key={`${r}${c}`}
          x={4 + c * 20}
          y={4 + r * 20}
          width="16"
          height="16"
          rx="4"
          fill={(r + c) % 2 ? '#000000' : '#9acaee'}
        />
      )),
    )}
  </svg>
);

const ScribbleArt = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
    <path
      d="M6 46c8-22 14 6 20-10s10 18 16 2 8 6 14-6"
      fill="none"
      stroke="#fe5000"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
);

const BubbleArt = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
    {[
      [16, 18, 10],
      [42, 14, 8],
      [50, 38, 11],
      [20, 44, 9],
      [38, 32, 6],
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="#ff9e72" stroke="#fe5000" strokeWidth="1.5" />
    ))}
  </svg>
);

const StretchArt = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="12" r="7" fill="#fe5000" />
    <line x1="32" y1="19" x2="32" y2="42" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
    <line x1="32" y1="22" x2="14" y2="6" stroke="#9acaee" strokeWidth="5" strokeLinecap="round" />
    <line x1="32" y1="22" x2="50" y2="6" stroke="#9acaee" strokeWidth="5" strokeLinecap="round" />
    <line x1="32" y1="42" x2="22" y2="60" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
    <line x1="32" y1="42" x2="42" y2="60" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

const IllusionArt = () => {
  const cx = 32;
  const cy = 32;
  const r = 27;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => {
        const a0 = (i * 45 - 90) * (Math.PI / 180);
        const a1 = ((i + 1) * 45 - 90) * (Math.PI / 180);
        const x0 = cx + r * Math.cos(a0);
        const y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1);
        const y1 = cy + r * Math.sin(a1);
        return (
          <path
            key={i}
            d={`M${cx},${cy} L${x0},${y0} A${r},${r} 0 0,1 ${x1},${y1} Z`}
            fill={i % 2 ? '#ff9e72' : '#fe5000'}
          />
        );
      })}
    </svg>
  );
};

const HeartArt = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
    <path
      d="M32 54C18 44 8 35 8 24a13 13 0 0 1 24-7 13 13 0 0 1 24 7c0 11-10 20-24 30Z"
      fill="#fe5000"
    />
  </svg>
);

const THINGS = [
  {
    key: 'breathe',
    title: 'Breathe',
    blurb: 'Follow the circle in and out for a minute or two. Nothing to win.',
    time: 'About 90 seconds',
    art: RingArt,
    view: Breathe,
  },
  {
    key: 'match',
    title: "Today's pairs",
    blurb: 'Six pairs to find. Everyone in the company gets the same cards today.',
    time: 'Two minutes, tops',
    art: GridArt,
    view: Match,
  },
  {
    key: 'doodle',
    title: 'Doodle pad',
    blurb: 'A new prompt every day and somewhere to scribble. Nothing is saved.',
    time: 'As long as you like',
    art: ScribbleArt,
    view: Doodle,
  },
  {
    key: 'bubble',
    title: 'Bubble wrap',
    blurb: 'A full sheet, ready to pop. Satisfying, pointless, yours.',
    time: 'A minute or so',
    art: BubbleArt,
    view: Bubble,
  },
  {
    key: 'stretch',
    title: 'Stretch it out',
    blurb: 'Five easy stretches for the neck, shoulders, and wrists. Get up for a bit.',
    time: 'About a minute',
    art: StretchArt,
    view: Stretch,
  },
  {
    key: 'illusions',
    title: 'Optical illusions',
    blurb: 'A few gentle illusions to look at, not solve. Nothing to figure out.',
    time: 'A minute or two',
    art: IllusionArt,
    view: Illusions,
  },
  {
    key: 'good',
    title: 'One good thing',
    blurb: 'Name one thing that went right today. Type it, then let it go.',
    time: 'A minute',
    art: HeartArt,
    view: GoodThing,
  },
];

export default function TakeFive() {
  const [open, setOpen] = useState(null);
  const thing = THINGS.find((t) => t.key === open);

  if (thing) {
    const View = thing.view;
    return (
      <div className="focus-sheet">
        <div className="focus-head">
          <h2>{thing.title}</h2>
          <button className="btn btn-quiet" onClick={() => setOpen(null)}>
            Back to the shelf
          </button>
        </div>
        <View />
      </div>
    );
  }

  return (
    <>
      <p className="wall-intro">
        A few small things to do when your head is full, for your head or your body.{' '}
        <b>Nobody can see whether you used them.</b>
      </p>
      <div className="shelf">
        {THINGS.map((t) => {
          const Art = t.art;
          return (
            <button key={t.key} className="thing" onClick={() => setOpen(t.key)}>
              <Art />
              <strong>{t.title}</strong>
              <span>{t.blurb}</span>
              <em>{t.time}</em>
            </button>
          );
        })}
      </div>
    </>
  );
}
