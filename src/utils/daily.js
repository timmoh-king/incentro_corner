/** Everyone in the company sees the same puzzle and prompt on the same day. */
export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`;
};

/** Small deterministic generator, seeded from the date. */
export const seeded = (seed) => {
  let s = Number(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export const shuffle = (list, rand) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export const firstName = (name = '') => name.split(' ')[0] || name;
