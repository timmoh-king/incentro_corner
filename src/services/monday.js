import mondaySdk from 'monday-sdk-js';
import {
  BOARD_ID,
  COLUMN_TITLES,
  REQUIRED_COLUMNS,
  VALUES_OPTIONS,
  DEPARTMENT_OPTIONS,
} from '../config/board';

const monday = mondaySdk();
monday.setApiVersion('2024-10');

/**
 * Outside monday's iframe (local dev, or the ?tv=1 display running in a
 * plain browser tab) there is no postMessage context to authenticate
 * through, so monday.get('context') never resolves. A personal API token
 * lets the SDK authenticate directly instead — see README "Running outside
 * monday". Same client-side-secret caveat as the HeyTaco key: this ships in
 * the built bundle, fine for internal dev, not for a public deployment.
 */
const API_TOKEN = import.meta.env.VITE_MONDAY_API_TOKEN || '';
if (API_TOKEN) monday.setToken(API_TOKEN);

/**
 * `demo` means "not authenticated to monday at all" — no real people, no real
 * anything. `boardReady` is narrower: "the notes board's schema matches what
 * this app expects". A board missing one column (e.g. Cheers) should only
 * fall the *notes* back to sample data, not the people picker too — they're
 * unrelated, see connectBoard() below.
 */
export const state = {
  demo: false,
  boardReady: false,
  boardId: BOARD_ID,
  columns: {},
  groupId: null,
  // {id, label} pairs for the Values dropdown — placeholder ids until
  // connectBoard() reads the real ones off the board's own column settings.
  valuesOptions: VALUES_OPTIONS.map((label, i) => ({ id: i + 1, label })),
  // Same idea, for the Department status column on the feedback form below.
  departmentOptions: DEPARTMENT_OPTIONS.map((label, i) => ({ id: i, label })),
};

const api = async (query, variables) => {
  const res = await monday.api(query, { variables });
  if (res?.errors?.length) throw new Error(res.errors[0].message);
  return res.data;
};

const parse = (cv) => {
  if (!cv?.value) return null;
  try {
    return JSON.parse(cv.value);
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------- who am I */

export async function getMe() {
  try {
    if (!API_TOKEN) {
      const ctx = await Promise.race([
        monday.get('context').then((r) => r?.data),
        new Promise((r) => setTimeout(() => r(null), 1500)),
      ]);
      if (!ctx) throw new Error('not inside monday');
    }
    const data = await api('query { me { id name photo_thumb } }');
    state.demo = false;
    return data.me;
  } catch {
    state.demo = true;
    return DEMO.me;
  }
}

export async function getPeople() {
  if (state.demo) return DEMO.people;
  const data = await api('query { users (kind: non_guests, limit: 200) { id name photo_thumb } }');
  return (data?.users || []).filter((u) => u.name);
}

/* ------------------------------------------------------------ board setup */

const BOARD_QUERY = `
  query ($boardId: [ID!]) {
    boards(ids: $boardId) {
      id
      name
      groups { id title }
      columns { id title type settings_str }
    }
  }
`;

/** Dropdown columns carry their label options in settings_str, e.g. {"labels":[{"id":1,"name":"..."}],"deactivated_labels":[1]}. */
const parseDropdownOptions = (settingsStr) => {
  try {
    const settings = JSON.parse(settingsStr || '{}');
    const deactivated = new Set(settings.deactivated_labels || []);
    return (settings.labels || [])
      .filter((l) => !deactivated.has(l.id))
      .map((l) => ({ id: l.id, label: l.name }));
  } catch {
    return [];
  }
};

/** Status columns carry their labels differently: {"labels":{"0":"Finance","1":"HR"},"deactivated_labels":[1]}. */
const parseStatusOptions = (settingsStr) => {
  try {
    const settings = JSON.parse(settingsStr || '{}');
    const deactivated = new Set(settings.deactivated_labels || []);
    const positions = settings.labels_positions_v2 || {};
    return Object.entries(settings.labels || {})
      .filter(([id]) => !deactivated.has(Number(id)))
      .map(([id, label]) => ({ id: Number(id), label, pos: positions[id] ?? Number(id) }))
      .sort((a, b) => a.pos - b.pos)
      .map(({ id, label }) => ({ id, label }));
  } catch {
    return [];
  }
};

/** Matches the board's columns to the titles in config, so no ids are hard-coded. */
export async function connectBoard() {
  if (state.demo || !state.boardId) {
    state.boardReady = false;
    return { ok: false, missing: [] };
  }
  const data = await api(BOARD_QUERY, { boardId: [state.boardId] });
  const board = data?.boards?.[0];
  if (!board) {
    state.boardReady = false;
    return { ok: false, missing: ['board'] };
  }
  state.groupId = board.groups?.[0]?.id || null;

  const missing = [];
  Object.entries(COLUMN_TITLES).forEach(([key, title]) => {
    const col = board.columns.find(
      (c) => c.title.trim().toLowerCase() === title.toLowerCase(),
    );
    if (col) {
      state.columns[key] = col.id;
      if (key === 'values') {
        const options = parseDropdownOptions(col.settings_str);
        if (options.length) state.valuesOptions = options;
      }
      if (key === 'department') {
        const options = parseStatusOptions(col.settings_str);
        if (options.length) state.departmentOptions = options;
      }
    } else missing.push({ key, title });
  });

  const missingRequired = missing.filter((m) => REQUIRED_COLUMNS.includes(m.key));
  state.boardReady = !missingRequired.length;
  return { ok: !missing.length, missing: missing.map((m) => m.title), boardName: board.name };
}

/* ------------------------------------------------------------------ notes */

const NOTES_QUERY = `
  query ($boardId: [ID!]) {
    boards(ids: $boardId) {
      items_page(limit: 300) {
        items {
          id
          name
          created_at
          column_values { id type text value }
        }
      }
    }
  }
`;

const normalise = (item) => {
  const map = {};
  (item.column_values || []).forEach((cv) => {
    map[cv.id] = cv;
  });
  const c = state.columns;
  const people = (cv) =>
    (parse(cv)?.personsAndTeams || []).map((p) => String(p.id));
  return {
    id: item.id,
    headline: item.name,
    createdAt: item.created_at,
    to: map[c.to]?.text || '',
    toIds: people(map[c.to]),
    from: map[c.from]?.text || '',
    fromIds: people(map[c.from]),
    message: map[c.message]?.text || '',
    category: map[c.category]?.text || '',
    department: map[c.department]?.text || '',
    cheers: Number(map[c.cheers]?.text || 0),
    values: (map[c.values]?.text || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  };
};

export async function getNotes() {
  if (state.demo || !state.boardReady) return DEMO.notes();
  const data = await api(NOTES_QUERY, { boardId: [state.boardId] });
  const items = data?.boards?.[0]?.items_page?.items || [];
  return items
    .map(normalise)
    // Department feedback lives in this same board/group, marked by having a
    // Department set — that's what keeps it off the wall, see
    // submitDeptFeedback(). A fun fact has no "To" either, but no Department,
    // so it stays on. Thank-you notes never set Department, so they're unaffected.
    .filter((n) => !n.department)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

const CREATE = `
  mutation ($boardId: ID!, $groupId: String, $name: String!, $values: JSON!) {
    create_item(
      board_id: $boardId
      group_id: $groupId
      item_name: $name
      column_values: $values
      create_labels_if_missing: false
    ) { id }
  }
`;

export async function pinNote({ toId, toName, message, category, values }, me) {
  if (state.demo || !state.boardReady) {
    return DEMO.add({ toId, toName, message, category, values }, me);
  }
  const c = state.columns;
  const columnValues = {
    [c.to]: { personsAndTeams: [{ id: Number(toId), kind: 'person' }] },
    [c.from]: { personsAndTeams: [{ id: Number(me.id), kind: 'person' }] },
    [c.message]: { text: message },
    [c.category]: { label: category },
  };
  if (c.cheers) columnValues[c.cheers] = '0';
  if (c.values) {
    const ids = (values || [])
      .map((label) => state.valuesOptions.find((o) => o.label === label)?.id)
      .filter((id) => id != null);
    columnValues[c.values] = { ids };
  }
  const data = await api(CREATE, {
    boardId: state.boardId,
    groupId: state.groupId,
    name: `Thanks to ${toName}`,
    values: JSON.stringify(columnValues),
  });
  return data?.create_item?.id;
}

/**
 * Feedback for a department — same board and group as thank-you notes (so it
 * doesn't need a board id of its own), but with no "To" person set. That's
 * what getNotes() filters on to keep this off the wall. No monthly cap: send
 * as many as you like. Not anonymous — From is the real submitter, same as a
 * note, so a department can follow up if needed; it's just never public.
 */
export async function submitDeptFeedback({ department, message }, me) {
  if (state.demo || !state.boardReady) return DEMO.addFeedback({ department, message }, me);
  const c = state.columns;
  const columnValues = {
    [c.from]: { personsAndTeams: [{ id: Number(me.id), kind: 'person' }] },
    [c.message]: { text: message },
  };
  if (c.department) columnValues[c.department] = { label: department };
  const data = await api(CREATE, {
    boardId: state.boardId,
    groupId: state.groupId,
    name: `Feedback for ${department}`,
    values: JSON.stringify(columnValues),
  });
  return data?.create_item?.id;
}

/**
 * A fun fact — same board/group as a thank-you note, but with no "To" person
 * and no Category. Values is optional here (unlike a thank-you note, where
 * it's required). No Department is set, which is what keeps it (unlike
 * department feedback) showing up on the wall.
 */
export async function submitFunFact({ message, values }, me) {
  if (state.demo || !state.boardReady) return DEMO.addFunFact({ message, values }, me);
  const c = state.columns;
  const columnValues = {
    [c.from]: { personsAndTeams: [{ id: Number(me.id), kind: 'person' }] },
    [c.message]: { text: message },
  };
  if (c.cheers) columnValues[c.cheers] = '0';
  if (c.values && values?.length) {
    const ids = values
      .map((label) => state.valuesOptions.find((o) => o.label === label)?.id)
      .filter((id) => id != null);
    if (ids.length) columnValues[c.values] = { ids };
  }
  const data = await api(CREATE, {
    boardId: state.boardId,
    groupId: state.groupId,
    name: 'Fun fact',
    values: JSON.stringify(columnValues),
  });
  return data?.create_item?.id;
}

const SET_NUMBER = `
  mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
    change_simple_column_value(
      board_id: $boardId
      item_id: $itemId
      column_id: $columnId
      value: $value
    ) { id }
  }
`;

export async function addCheer(note) {
  const next = (note.cheers || 0) + 1;
  if (state.demo || !state.boardReady) return DEMO.cheer(note.id, next);
  if (!state.columns.cheers) return next; // no Cheers column on this board — reflects locally, doesn't persist
  await api(SET_NUMBER, {
    boardId: state.boardId,
    itemId: note.id,
    columnId: state.columns.cheers,
    value: String(next),
  });
  return next;
}

/* ------------------------------------------------------------- quiet mode */

const QUIET_KEY = 'breather_quiet_list';

/** People who would rather not be thanked in public. Nobody else sees this list. */
export async function getQuietList() {
  if (state.demo) return DEMO.quiet;
  try {
    const res = await monday.storage.instance.getItem(QUIET_KEY);
    return JSON.parse(res?.data?.value || '[]');
  } catch {
    return [];
  }
}

export async function setQuiet(userId, quiet) {
  const list = new Set(await getQuietList());
  if (quiet) list.add(String(userId));
  else list.delete(String(userId));
  const next = [...list];
  if (state.demo) {
    DEMO.quiet = next;
    return next;
  }
  await monday.storage.instance.setItem(QUIET_KEY, JSON.stringify(next));
  return next;
}

/* -------------------------------------------------------------- demo data */

const ago = (mins) => new Date(Date.now() - mins * 60000).toISOString();

let demoNotes = [
  {
    id: 'd1', headline: 'Thanks to Grace', createdAt: ago(40),
    to: 'Grace Wanjiru', toIds: ['2'], from: 'Brian Otieno', fromIds: ['3'],
    message: 'You stayed on the call with the Sanru team until it made sense. I would still be there without you.',
    category: 'Went above and beyond', cheers: 4, values: ['#Mastery', '#Camaraderie'],
  },
  {
    id: 'd2', headline: 'Thanks to Timothy', createdAt: ago(180),
    to: 'Timothy Kariuki', toIds: ['1'], from: 'Aisha Noor', fromIds: ['4'],
    message: 'The board you set up for onboarding saved me a whole afternoon. Quietly excellent work.',
    category: 'Quietly brilliant', cheers: 7, values: ['#Mastery'],
  },
  {
    id: 'd3', headline: 'Thanks to Peter', createdAt: ago(400),
    to: 'Peter Mwangi', toIds: ['5'], from: 'Grace Wanjiru', fromIds: ['2'],
    message: 'Thank you for noticing I was drowning last week and just taking two things off my plate.',
    category: 'Made my day', cheers: 11, values: ['#Camaraderie'],
  },
  {
    id: 'd4', headline: 'Thanks to Brian', createdAt: ago(1500),
    to: 'Brian Otieno', toIds: ['3'], from: 'Timothy Kariuki', fromIds: ['1'],
    message: 'You explained the mirror columns three times without once making me feel slow.',
    category: 'Helped me out', cheers: 6, values: ['#Camaraderie', '#Autonomy'],
  },
  {
    id: 'd5', headline: 'Thanks to Aisha', createdAt: ago(2600),
    to: 'Aisha Noor', toIds: ['4'], from: 'Peter Mwangi', fromIds: ['5'],
    message: 'Your notes from the client workshop were better than anything I would have written.',
    category: 'Quietly brilliant', cheers: 3, values: ['#Mastery', '#Boldness'],
  },
  {
    id: 'd6', headline: 'Thanks to Grace', createdAt: ago(4300),
    to: 'Grace Wanjiru', toIds: ['2'], from: 'Timothy Kariuki', fromIds: ['1'],
    message: 'You brought mandazi on the worst Monday of the quarter. Small thing, big difference.',
    category: 'Made my day', cheers: 9, values: ['#Camaraderie'],
  },
];

const DEMO = {
  me: { id: '1', name: 'Timothy Kariuki', photo_thumb: '' },
  people: [
    { id: '1', name: 'Timothy Kariuki' },
    { id: '2', name: 'Grace Wanjiru' },
    { id: '3', name: 'Brian Otieno' },
    { id: '4', name: 'Aisha Noor' },
    { id: '5', name: 'Peter Mwangi' },
    { id: '6', name: 'Njeri Kamau' },
  ],
  quiet: [],
  notes: () => demoNotes.map((n) => ({ ...n })),
  add: ({ toId, toName, message, category, values }, me) => {
    const id = `d${Date.now()}`;
    demoNotes = [
      {
        id, headline: `Thanks to ${toName.split(' ')[0]}`, createdAt: new Date().toISOString(),
        to: toName, toIds: [String(toId)], from: me.name, fromIds: [String(me.id)],
        message, category, cheers: 0, values: values || [],
      },
      ...demoNotes,
    ];
    return id;
  },
  cheer: (id, next) => {
    demoNotes = demoNotes.map((n) => (n.id === id ? { ...n, cheers: next } : n));
    return next;
  },
  // Sample mode just needs this to succeed — feedback never shows up on the
  // (also sample) wall either way, same as it wouldn't on a real board.
  addFeedback: () => `d${Date.now()}`,
  addFunFact: ({ message, values }, me) => {
    const id = `d${Date.now()}`;
    demoNotes = [
      {
        id, headline: 'Fun fact', createdAt: new Date().toISOString(),
        to: '', toIds: [], from: me.name, fromIds: [String(me.id)],
        message, category: '', cheers: 0, values: values || [],
      },
      ...demoNotes,
    ];
    return id;
  },
};
