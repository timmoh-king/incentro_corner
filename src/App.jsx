import React, { useCallback, useEffect, useState } from 'react';
import Wall from './components/Wall';
import TakeFive from './components/TakeFive';
import ForYou from './components/ForYou';
import { Face, useToast } from './components/ui';
import {
  addCheer,
  connectBoard,
  getMe,
  getNotes,
  getPeople,
  getQuietList,
  pinNote,
  setQuiet,
  submitDeptFeedback,
  submitFunFact,
  state,
} from './services/monday';

const TABS = [
  { key: 'wall', label: 'The wall' },
  { key: 'five', label: 'Take five' },
  { key: 'you', label: 'For you' },
];

const readLocal = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — storage may be blocked, the preference just will not persist */
  }
};

export default function App() {
  const toast = useToast();
  const [tab, setTab] = useState('wall');
  const [me, setMe] = useState(null);
  const [people, setPeople] = useState([]);
  const [notes, setNotes] = useState([]);
  const [quietList, setQuietList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinning, setPinning] = useState(false);
  const [calm, setCalm] = useState(() => readLocal('breather_calm', '0') === '1');
  const [tour, setTour] = useState(() => !readLocal('breather_seen_intro', ''));

  const toggleCalm = () => {
    setCalm((c) => {
      writeLocal('breather_calm', c ? '0' : '1');
      return !c;
    });
  };

  const dismissTour = () => {
    setTour(false);
    writeLocal('breather_seen_intro', '1');
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getMe();
      setMe(user);
      await connectBoard();
      const [rows, folks, quiet] = await Promise.all([getNotes(), getPeople(), getQuietList()]);
      setNotes(rows);
      setPeople(folks);
      setQuietList(quiet);
    } catch (err) {
      toast(err.message || 'Could not reach the board.', 'warn');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handlers = {
    create: async (payload) => {
      setPinning(true);
      try {
        await pinNote(payload, me);
        setNotes(await getNotes());
        toast(`Pinned. ${payload.toName.split(' ')[0]} will see it.`);
        return true;
      } catch (err) {
        toast(err.message || 'That did not pin. Try again.', 'warn');
        return false;
      } finally {
        setPinning(false);
      }
    },
    cheer: async (note) => {
      const next = await addCheer(note);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, cheers: next } : n)));
      return next;
    },
    funFact: async (payload) => {
      setPinning(true);
      try {
        await submitFunFact(payload, me);
        setNotes(await getNotes());
        toast('Shared on the wall.');
        return true;
      } catch (err) {
        toast(err.message || 'That did not share. Try again.', 'warn');
        return false;
      } finally {
        setPinning(false);
      }
    },
  };

  const sendDeptFeedback = async ({ department, message }) => {
    try {
      await submitDeptFeedback({ department, message }, me);
      toast(`Sent to ${department}.`);
      return true;
    } catch (err) {
      toast(err.message || 'That did not send. Try again.', 'warn');
      return false;
    }
  };

  const changeQuiet = async (quiet) => {
    const next = await setQuiet(me.id, quiet);
    setQuietList(next);
    toast(quiet ? 'You are off the wall.' : 'People can thank you on the wall again.');
  };

  return (
    <div className={`app${calm ? ' calm' : ''}`}>
      {tour && (
        <div className="tour-veil" role="dialog" aria-modal="true" aria-label="Welcome to Breather">
          <div className="tour-card">
            <h2>Welcome to Breather</h2>
            <p>A quiet corner of monday, in three parts.</p>
            <ul>
              <li>
                <strong>The wall</strong> — pin a thank-you for a colleague, or read what others
                have pinned.
              </li>
              <li>
                <strong>Take five</strong> — a couple of minutes away from the boards. Nothing is
                recorded.
              </li>
              <li>
                <strong>For you</strong> — the notes people have left you, and the option to stay
                off the wall.
              </li>
            </ul>
            <button className="btn btn-go" onClick={dismissTour}>
              Got it
            </button>
          </div>
        </div>
      )}

      <header className="bar">
        <h1 className="mark">
          Breather
          <span>a quiet corner of monday</span>
        </h1>

        <span className="bar-spacer" />

        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className="tab"
              aria-current={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {state.demo && <span className="sample-flag">Sample data</span>}

        <button
          className="calm-toggle"
          aria-pressed={calm}
          onClick={toggleCalm}
          title="Turn off animation and motion throughout the app"
        >
          {calm ? 'Motion off' : 'Reduce motion'}
        </button>

        <span className="whoami">
          <Face user={me} />
        </span>
      </header>

      <main className="stage">
        {tab === 'wall' && (
          <Wall
            notes={notes}
            people={people}
            me={me}
            quietList={quietList}
            loading={loading}
            onPin={handlers}
            pinning={pinning}
          />
        )}
        {tab === 'five' && <TakeFive />}
        {tab === 'you' && (
          <ForYou
            me={me}
            quietList={quietList}
            onQuietChange={changeQuiet}
            onFeedback={sendDeptFeedback}
          />
        )}
      </main>
    </div>
  );
}
