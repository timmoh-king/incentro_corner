import React, { useState } from 'react';
import { seeded, todayKey } from '../../utils/daily';

const PROMPTS = [
  'One thing that went right today, even a small one.',
  'Something you are glad you did not skip today.',
  'Someone who made today slightly easier.',
  'A moment today that was fine, actually.',
  'One thing you are looking forward to.',
];

export default function GoodThing() {
  const [text, setText] = useState('');
  const prompt = PROMPTS[Math.floor(seeded(Number(todayKey()) + 1)() * PROMPTS.length)];

  return (
    <div>
      <p className="doodle-prompt">{prompt}</p>
      <textarea
        className="control"
        style={{ minHeight: 140 }}
        maxLength={280}
        placeholder="Type it here. Nobody reads this but you."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn btn-quiet" onClick={() => setText('')} disabled={!text}>
          Clear
        </button>
      </div>
      <p style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 10 }}>
        Not saved, not sent anywhere. It disappears when you leave this tab.
      </p>
    </div>
  );
}
