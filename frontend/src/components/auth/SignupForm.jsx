import { useState } from 'react';
import PasswordField from './PasswordField.jsx';
import Icon from '../Icon.jsx';
import { register, authErrorMessage } from '../../services/auth.js';

export default function SignupForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    if (data.get('name').trim().length < 2) { setError('Informe seu nome com pelo menos 2 caracteres.'); return; }
    if (data.get('password') !== data.get('confirm-password')) { setError('As senhas precisam ser iguais.'); return; }
    setError(''); setBusy(true);
    try {
      const result = await register(data.get('name'), data.get('email'), data.get('password'));
      window.location.assign(result.profilePending ? '/home?perfil=pendente' : '/home');
    } catch (signupError) { setError(authErrorMessage(signupError)); }
    finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={handleSubmit} aria-busy={busy}>
    <div className="form-field"><label htmlFor="signup-name">Seu nome</label><input id="signup-name" name="name" autoComplete="name" placeholder="Como podemos te chamar?" required minLength={2} maxLength={80} /></div>
    <div className="form-field"><label htmlFor="signup-email">E-mail</label><input id="signup-email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required maxLength={254} /></div>
    <PasswordField autoComplete="new-password" minLength={8} hint="Use pelo menos 8 caracteres. Combine letras, números e símbolos." />
    <PasswordField id="confirm-password" label="Confirmar senha" autoComplete="new-password" minLength={8} />
    <label className="checkbox-label signup-consent"><input type="checkbox" required />Entendo que esta é uma plataforma acadêmica com pagamentos simulados.</label>
    {error && <p className="form-message form-error" role="alert">{error}</p>}
    <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Criando sua conta…' : 'Criar minha conta'}<Icon name="arrow" /></button>
  </form>;
}
