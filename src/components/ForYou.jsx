import React, { useState } from 'react';
import { MESSAGE_LIMIT } from '../config/board';
import { firstName, seeded, todayKey } from '../utils/daily';
import { state as mondayState } from '../services/monday';

const LINES = [
  'Work you did last week is still holding something up. It counts, even unfinished.',
  'You do not have to be at your best today for today to be worth it.',
  'Somebody found their day easier because of something you did. They may not have said so.',
  'A slow morning is not a wasted one.',
  'You are allowed to close the laptop at the end of the day with things still on the board.',
  'Doing one thing properly beats touching six.',
  'Asking for help early is the cheapest thing you will do all week.',
  'Somebody on this team is having a harder week than you can see.',
  'The version you shipped today does not need to be the last version.',
  'Nobody remembers the day you took an extra five minutes at lunch.',
  'A good question is worth more than a fast answer.',
  'You do not owe anyone constant availability.',
  'Rest is not the opposite of getting things done.',
  'The inbox will still be there in twenty minutes.',
];

function DeptFeedback({ onSubmit }) {
  const [department, setDepartment] = useState('');
  const [message, setMessage] = useState('');
  const [problem, setProblem] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!department) return setProblem('Choose a department.');
    if (message.trim().length < 4) return setProblem('Write a line of feedback.');
    setProblem('');
    setSending(true);
    const ok = await onSubmit({ department, message: message.trim() });
    setSending(false);
    if (ok) {
      setDepartment('');
      setMessage('');
      setSent(true);
    }
    return undefined;
  };

  return (
    <>
      <h3 style={{ margin: '0 0 6px', fontSize: 17 }}>Feedback for a department</h3>
      <p style={{ color: 'var(--ink-soft)', margin: '0 0 14px', maxWidth: '56ch' }}>
        Goes straight to that department, not the wall. Send as many as you like, whenever you
        have something to say.
      </p>

      {problem && <div className="notice">{problem}</div>}

      <div className="field">
        <label htmlFor="dept">Which department?</label>
        <select
          id="dept"
          className="control"
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setSent(false);
          }}
        >
          <option value="">Pick a department</option>
          {mondayState.departmentOptions.map((d) => (
            <option key={d.id} value={d.label}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="deptmsg">What would you like them to know?</label>
        <textarea
          id="deptmsg"
          className="control"
          maxLength={MESSAGE_LIMIT}
          placeholder="Feedback, a concern, or just something worth flagging."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setSent(false);
          }}
        />
        <p className="counter">
          {message.length} / {MESSAGE_LIMIT}
        </p>
      </div>

      <button className="btn btn-go" onClick={submit} disabled={sending}>
        {sending ? 'Sending…' : 'Send feedback'}
      </button>
      {sent && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '10px 0 0' }}>
          Sent — thanks.
        </p>
      )}
    </>
  );
}

export default function ForYou({ me, quietList, onQuietChange, onFeedback }) {
  const line = LINES[Math.floor(seeded(todayKey())() * LINES.length)];
  const quiet = quietList.includes(String(me?.id));

  return (
    <div className="sheet">
      <h2>Hello {firstName(me?.name) || 'there'}</h2>
      <p className="lede">{line}</p>

      <hr style={{ border: 0, borderTop: '1px solid var(--paper-edge)', margin: '26px 0 20px' }} />

      <h3 style={{ margin: '0 0 6px', fontSize: 17 }}>Being thanked in public</h3>
      <p style={{ color: 'var(--ink-soft)', margin: '0 0 14px', maxWidth: '56ch' }}>
        Some people would rather not have their name on the wall. If that is you, turn this on and
        nobody will be able to pick you when they write a note. You can change it back any time, and
        nobody is told either way.
      </p>
      <button className="btn btn-quiet" onClick={() => onQuietChange(!quiet)}>
        {quiet ? 'Let people thank me on the wall' : 'Keep me off the wall'}
      </button>
      {quiet && (
        <p style={{ color: 'var(--ink-faint)', fontSize: 13.5, marginBottom: 0 }}>
          You are off the list. Notes already on the wall stay where they are.
        </p>
      )}

      <hr style={{ border: 0, borderTop: '1px solid var(--paper-edge)', margin: '26px 0 20px' }} />

      <DeptFeedback onSubmit={onFeedback} />
    </div>
  );
}
