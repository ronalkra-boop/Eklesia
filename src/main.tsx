import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Versión del paquete de la app para control de caché
const APP_VERSION = 'v2.2.0-clean-db-roles';

// Limpieza de cachés antiguas si la versión de la app cambió
if (typeof window !== 'undefined') {
  const savedVersion = localStorage.getItem('ekklesia_app_version');
  if (savedVersion && savedVersion !== APP_VERSION) {
    localStorage.setItem('ekklesia_app_version', APP_VERSION);
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
  } else if (!savedVersion) {
    localStorage.setItem('ekklesia_app_version', APP_VERSION);
  }
}

// Auto-actualización inmediata del Service Worker para celular y PWA
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Forzar actualización inmediata para que la versión empaquetada en celular se actualice
    updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      registration.update();
      // Chequear actualizaciones activas en segundo plano cada 30 segundos
      setInterval(() => {
        registration.update();
      }, 30 * 1000);
    }
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

