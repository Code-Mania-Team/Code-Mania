import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
//import { AuthProvider } from "./context/AuthContext";
// import { AuthProvider } from './context/authProvider.jsx'
window.__CODE_MANIA_TERMINAL_ACTIVE__ = false;

window.addEventListener("code-mania:terminal-active", () => {
  window.__CODE_MANIA_TERMINAL_ACTIVE__ = true;
});

window.addEventListener("code-mania:terminal-inactive", () => {
  window.__CODE_MANIA_TERMINAL_ACTIVE__ = false;
});
createRoot(document.getElementById('root')).render(
  <StrictMode>
      <App />
  </StrictMode>,
)
