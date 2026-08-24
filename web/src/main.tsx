import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Block default browser hotkeys: F11 (Fullscreen), F12 (DevTools), F5 (Reload), Ctrl+R, etc.
window.addEventListener(
  'keydown',
  (e) => {
    // If user is inside an input or recording a custom hotkey, do not block regular typing
    const target = e.target as HTMLElement | null;
    const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

    if (
      e.key === 'F11' ||
      e.key === 'F12' ||
      e.key === 'F5' ||
      e.key === 'F7' ||
      (e.ctrlKey && (e.key === 'r' || e.key === 'R')) ||
      (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key))
    ) {
      e.preventDefault();
      e.stopPropagation();

      // Trigger DustFX Actions directly
      if (!isInput) {
        if (e.key === 'F11') {
          window.dispatchEvent(new CustomEvent('dustfx-action-maxgamma'));
        } else if (e.key === 'F10') {
          window.dispatchEvent(new CustomEvent('dustfx-action-reset'));
        } else if (e.key === 'F12') {
          window.dispatchEvent(new CustomEvent('dustfx-action-vibrance'));
        }
      }
    }
  },
  { capture: true }
);

// Prevent right-click context menu (inspect element)
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
