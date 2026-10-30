import { useState } from 'react';
import PasswordField from './PasswordField.jsx';
import Icon from '../Icon.jsx';
import { login, authErrorMessage } from '../../services/auth.js';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setError(''); setBusy(true);
    try {
      await login(data.get('email'), data.get('password'), data.get('remember') === 'on');
      window.location.assign('/home');
    } catch (loginError) { setError(authErrorMessage(loginError)); }
    finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={handleSubmit} aria-busy={busy}>
    <div className="form-field"><label htmlFor="login-email">E-mail</label><input id="login-email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required maxLength={254} /></div>
    <PasswordField />
    <div className="form-options"><label className="checkbox-label"><input type="checkbox" name="remember" defaultChecked />Lembrar de mim</label><a href="/esqueci-minha-senha">Esqueci minha senha</a></div>
    {error && <p className="form-message form-error" role="alert">{error}</p>}
    <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar na minha conta'}<Icon name="arrow" /></button>
  </form>;
}
