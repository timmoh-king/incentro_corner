import React, { useMemo, useState } from 'react';
import { CATEGORIES, MESSAGE_LIMIT, toneOf } from '../config/board';
import { firstName, timeAgo } from '../utils/daily';
import { LoadingWall, useToast } from './ui';
import { state as mondayState } from '../services/monday';

const TONE_VAR = {
  sky: 'var(--sky)',
  marigold: 'var(--marigold)',
  coral: 'var(--coral)',
  lilac: 'var(--lilac)',
};

function Note({ note, onCheer, cheered, readOnly }) {
  const isFact = !note.to;
  return (
    <div className="note-slot">
      <article className="note" style={{ '--tape': TONE_VAR[toneOf(note.category)] }}>
        <p className="note-cat">{isFact ? 'Fun fact' : note.category || 'Thank you'}</p>
        <p className="note-msg">{note.message}</p>
        {note.values?.length > 0 && (
          <div className="note-tags">
            {note.values.map((v) => (
              <span key={v} className="note-tag">
                {v}
              </span>
            ))}
          </div>
        )}
        <div className="note-foot">
          <span className="note-who">
            {isFact ? (
              <>
                Shared by <strong>{note.from}</strong>
              </>
            ) : (
              <>
                <strong>{note.from}</strong> thanked <strong>{note.to}</strong>
              </>
            )}
            <span className="note-when">{timeAgo(note.createdAt)}</span>
          </span>
          {!readOnly && (
            <button
              className="cheer"
              aria-pressed={cheered}
              onClick={() => onCheer(note)}
              title="Add your thanks to this one"
            >
              👏 {note.cheers || 0}
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

function Composer({ people, me, quietList, onPin, onCancel, pinning }) {
  const [toId, setToId] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [message, setMessage] = useState('');
  const [selectedValues, setSelectedValues] = useState([]);
  const [problem, setProblem] = useState('');

  const options = useMemo(
    () =>
      people
        .filter((p) => String(p.id) !== String(me?.id))
        .filter((p) => !quietList.includes(String(p.id)))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [people, me, quietList],
  );

  const toggleValue = (label) => {
    setSelectedValues((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label],
    );
  };

  const submit = async () => {
    if (!toId) return setProblem('Choose who this is for.');
    if (message.trim().length < 4) return setProblem('Write a line about what they did.');
    if (!selectedValues.length) return setProblem('Pick at least one value this reflects.');
    setProblem('');
    const person = options.find((p) => String(p.id) === String(toId));
    const done = await onPin({
      toId,
      toName: person.name,
      message: message.trim(),
      category,
      values: selectedValues,
    });
    if (done) {
      setToId('');
      setMessage('');
      setSelectedValues([]);
    }
    return undefined;
  };

  return (
    <section className="sheet" style={{ marginBottom: 26 }}>
      <h2>Pin a thank-you</h2>
      <p className="lede">
        It goes up on the wall with your name on it. Anyone in the workspace can read it.
      </p>

      {problem && <div className="notice">{problem}</div>}

      <div className="field">
        <label htmlFor="to">Who is it for?</label>
        <select id="to" className="control" value={toId} onChange={(e) => setToId(e.target.value)}>
          <option value="">Pick a colleague</option>
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>What kind of thank-you?</label>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              type="button"
              className="chip"
              style={{ '--chip': TONE_VAR[c.tone] }}
              aria-pressed={category === c.label}
              onClick={() => setCategory(c.label)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Which values does this reflect? (choose at least one)</label>
        <div className="chips">
          {mondayState.valuesOptions.map((v) => (
            <button
              key={v.id}
              type="button"
              className="chip"
              aria-pressed={selectedValues.includes(v.label)}
              onClick={() => toggleValue(v.label)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="msg">What did they do?</label>
        <textarea
          id="msg"
          className="control"
          maxLength={MESSAGE_LIMIT}
          placeholder="You stayed late to get the client demo working. I noticed."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="counter">
          {message.length} / {MESSAGE_LIMIT}
        </p>
      </div>

      <div className="row">
        <button className="btn btn-go" onClick={submit} disabled={pinning}>
          {pinning ? 'Pinning…' : 'Pin it to the wall'}
        </button>
        <button className="btn btn-quiet" onClick={onCancel}>
          Not now
        </button>
      </div>
    </section>
  );
}

function FunFact({ onSubmit, onCancel, sending }) {
  const [message, setMessage] = useState('');
  const [selectedValues, setSelectedValues] = useState([]);
  const [problem, setProblem] = useState('');

  const toggleValue = (label) => {
    setSelectedValues((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label],
    );
  };

  const submit = async () => {
    if (message.trim().length < 4) return setProblem('Write your fun fact.');
    setProblem('');
    const done = await onSubmit({ message: message.trim(), values: selectedValues });
    if (done) {
      setMessage('');
      setSelectedValues([]);
    }
    return undefined;
  };

  return (
    <section className="sheet" style={{ marginBottom: 26 }}>
      <h2>Share a fun fact</h2>
      <p className="lede">
        Not for a person or a department — just something fun, on the wall for everyone.
      </p>

      {problem && <div className="notice">{problem}</div>}

      <div className="field">
        <label htmlFor="fact">What's the fun fact?</label>
        <textarea
          id="fact"
          className="control"
          maxLength={MESSAGE_LIMIT}
          placeholder="I once fixed a production bug from a hospital waiting room."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="counter">
          {message.length} / {MESSAGE_LIMIT}
        </p>
      </div>

      <div className="field">
        <label>Any values this touches on? (optional)</label>
        <div className="chips">
          {mondayState.valuesOptions.map((v) => (
            <button
              key={v.id}
              type="button"
              className="chip"
              aria-pressed={selectedValues.includes(v.label)}
              onClick={() => toggleValue(v.label)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <button className="btn btn-go" onClick={submit} disabled={sending}>
          {sending ? 'Sharing…' : 'Share it'}
        </button>
        <button className="btn btn-quiet" onClick={onCancel}>
          Not now
        </button>
      </div>
    </section>
  );
}

export default function Wall({ notes, people, me, quietList, loading, onPin, pinning }) {
  const [mode, setMode] = useState(null); // null | 'thanks' | 'fact'
  const [cheered, setCheered] = useState([]);
  const [local, setLocal] = useState({});
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const monthCount = useMemo(() => {
    const now = new Date();
    return notes.filter((n) => {
      const d = new Date(n.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [notes]);

  const visible = useMemo(
    () => (filter === 'all' ? notes : notes.filter((n) => n.category === filter)).slice(0, 5),
    [notes, filter],
  );

  const cheer = async (note) => {
    if (cheered.includes(note.id)) return;
    setCheered((c) => [...c, note.id]);
    setLocal((l) => ({ ...l, [note.id]: (note.cheers || 0) + 1 }));
    try {
      await onPin.cheer(note);
    } catch {
      toast('That did not save. Try again in a moment.', 'warn');
    }
  };

  const pin = async (payload) => {
    const ok = await onPin.create(payload);
    if (ok) setMode(null);
    return ok;
  };

  const shareFact = async (payload) => {
    const ok = await onPin.funFact(payload);
    if (ok) setMode(null);
    return ok;
  };

  return (
    <>
      {mode === 'thanks' && (
        <Composer
          people={people}
          me={me}
          quietList={quietList}
          onPin={pin}
          onCancel={() => setMode(null)}
          pinning={pinning}
        />
      )}

      {mode === 'fact' && (
        <FunFact onSubmit={shareFact} onCancel={() => setMode(null)} sending={pinning} />
      )}

      {!mode && monthCount > 0 && (
        <p className="wall-stat">
          <strong>{monthCount}</strong> {monthCount === 1 ? 'thank-you' : 'thank-yous'} pinned
          this month, company-wide.
        </p>
      )}

      {!mode && notes.length > 0 && (
        <div className="chips wall-filter">
          <button className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              className="chip"
              style={{ '--chip': TONE_VAR[c.tone] }}
              aria-pressed={filter === c.label}
              onClick={() => setFilter(c.label)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingWall />
      ) : (
        <div className="notes">
          {!mode && (
            <>
              <button className="pin-tile" onClick={() => setMode('thanks')}>
                <span className="plus" aria-hidden="true">
                  +
                </span>
                <strong>Pin a thank-you</strong>
                <span className="sub">Someone probably deserves one today</span>
              </button>
              <button className="pin-tile" onClick={() => setMode('fact')}>
                <span className="plus" aria-hidden="true">
                  +
                </span>
                <strong>Share a fun fact</strong>
                <span className="sub">No person, no department — just something fun</span>
              </button>
            </>
          )}

          {visible.map((n) => (
            <Note
              key={n.id}
              note={{ ...n, cheers: local[n.id] ?? n.cheers }}
              cheered={cheered.includes(n.id)}
              onCheer={cheer}
            />
          ))}

          {!visible.length && !mode && (
            <div className="empty">
              {filter === 'all'
                ? 'The wall is empty. Be the first — thank someone for something small.'
                : 'No notes in this category yet.'}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export { firstName, Note };
