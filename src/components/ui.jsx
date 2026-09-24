import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone === 'warn' ? 'warn' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

export function Face({ user }) {
  if (user?.photo_thumb) return <img className="face" src={user.photo_thumb} alt="" />;
  return <span className="face">{initials(user?.name) || '?'}</span>;
}

export function LoadingWall() {
  return (
    <div className="notes" aria-hidden="true">
      {[170, 130, 210, 150, 190, 140, 160, 120].map((h, i) => (
        <div key={i} className="skeleton-note" style={{ height: h }} />
      ))}
    </div>
  );
}
