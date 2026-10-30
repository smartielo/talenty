import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import NotFound from './pages/NotFound.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import FeedPage from './pages/FeedPage.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './styles.css';

const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const routes = {
  '/': <App />,
  '/login': <AuthPage />,
  '/cadastro': <AuthPage initialMode="signup" />,
  '/esqueci-minha-senha': <ForgotPassword />,
  '/home': <FeedPage />,
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>{routes[pathname] || <NotFound />}</AuthProvider>
  </React.StrictMode>,
);
