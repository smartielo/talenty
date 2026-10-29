import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import NotFound from './pages/NotFound.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.pathname === '/' ? <App /> : <NotFound />}
  </React.StrictMode>,
);
