import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import TVDisplay from './components/TVDisplay';
import { ToastProvider } from './components/ui';
import './styles/app.css';

const isTv = new URLSearchParams(window.location.search).get('tv') === '1';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>{isTv ? <TVDisplay /> : <App />}</ToastProvider>
  </React.StrictMode>,
);
