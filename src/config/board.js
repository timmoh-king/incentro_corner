/**
 * Breather stores every thank-you as an item on one monday board.
 *
 * You do not need to look up column ids. Create a board with the column titles
 * below and the app finds them by title when it starts. If you rename a column
 * in monday, change the title here to match.
 */
export const BOARD_ID = import.meta.env.VITE_KUDOS_BOARD_ID || '';

export const COLUMN_TITLES = {
  to: 'To',
  from: 'From',
  message: 'Message',
  category: 'Category',
  cheers: 'Cheers',
  values: 'Values',
  department: 'Department',
};

/**
 * Everything except cheers/department has to exist for the board to be usable
 * at all. Cheers is a nice-to-have on top of a note; department feedback is a
 * separate flow that reuses this same board/group but doesn't touch notes at
 * all — neither is a reason to fall back to sample data for pinning notes.
 */
export const REQUIRED_COLUMNS = ['to', 'from', 'message', 'category', 'values'];

/**
 * Fallback options for the "Values" multi-select before a real board is
 * connected (or in sample mode). Once connected, services/monday.js reads
 * the real dropdown labels + ids from the Values column itself, so this only
 * matters for demo/offline rendering — it does not need to stay in sync.
 */
export const VALUES_OPTIONS = ['#Autonomy', '#Boldness', '#Mastery', '#Camaraderie'];

/**
 * Same idea as VALUES_OPTIONS, but for the Department status column that
 * powers the "feedback for a department" section on the For You page.
 */
export const DEPARTMENT_OPTIONS = ['Finance', 'HR', 'Google', 'Monday', 'Camunda', 'Leadership'];

/**
 * Categories double as the colour of the note on the wall. Keep the labels
 * identical to the ones on the board's Category column.
 */
export const CATEGORIES = [
  { label: 'Helped me out', tone: 'sky' },
  { label: 'Went above and beyond', tone: 'marigold' },
  { label: 'Made my day', tone: 'coral' },
  { label: 'Quietly brilliant', tone: 'lilac' },
];

export const toneOf = (label) =>
  CATEGORIES.find((c) => c.label === label)?.tone || 'sky';

/** Nothing here counts, ranks or reports on anyone. Please keep it that way. */
export const MESSAGE_LIMIT = 240;
