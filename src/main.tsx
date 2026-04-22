import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Commercial Security Lockdown
if (import.meta.env.PROD) {
  // Prevent context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Prevent some keyboard shortcuts (F12, Ctr+Shift+I, etc)
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault();
    }
  });

  console.log(
    '%cFitAI Security System',
    'color: red; font-size: 30px; font-weight: bold; text-shadow: 2px 2px black;'
  );
  console.log(
    '%cEsta é uma área protegida. Alterar o código aqui pode resultar no bloqueio permanente da sua conta por violação dos termos de serviço comercial.',
    'color: white; font-size: 14px;'
  );
}
