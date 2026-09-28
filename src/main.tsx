import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './services/swRegister.ts';

// Daftarkan Service Worker saat aplikasi dimuat
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    registerServiceWorker(() => {
      // Callback update cache baru tersedia
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
