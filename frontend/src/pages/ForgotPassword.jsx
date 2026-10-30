import { useState } from 'react';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { resetPassword, authErrorMessage } from '../services/auth.js';
import usePageTitle from '../hooks/usePageTitle.js';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { configured } = useAuth();
  usePageTitle('Recuperar senha');
  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const email = new FormData(event.currentTarget).get('email');
    setError(''); setBusy(true);
    try { await resetPassword(email); setSent(true); }
    catch (resetError) {
      if (resetError.code === 'auth/user-not-found') setSent(true);
      else setError(authErrorMessage(resetError));
    } finally { setBusy(false); }
  }
  return <AuthLayout>
    <span className="auth-feature-icon"><Icon name={sent ? 'mail' : 'lock'} /></span>
    <span className="auth-eyebrow">{sent ? 'PRÓXIMO PASSO: SUA CAIXA DE ENTRADA' : 'ACONTECE COM TODO MUNDO'}</span>
    <h1>{sent ? 'Confere teu' : 'Esqueceu a'}<br /><span className="highlight">{sent ? 'e-mail.' : 'senha?'}</span></h1>
    <p className="auth-intro">{sent ? 'Se existir uma conta com esse e-mail, você receberá as instruções para criar uma nova senha. Confira também a pasta de spam.' : 'Sem estresse. Informe o e-mail da sua conta e a gente te ajuda a começar de novo.'}</p>
    {sent ? <div className="reset-success" role="status"><p>Abra o link recebido e escolha uma nova senha. Depois, volte para entrar na sua conta.</p><a href="/login" className="button button-primary auth-submit">Voltar para o login<Icon name="arrow" /></a><button className="text-link" type="button" onClick={() => { setSent(false); setError(''); }}>Usar outro e-mail</button></div> : <>
      {!configured && <p className="auth-demo-notice">O envio de e-mails de recuperação ainda não está disponível nesta demonstração.</p>}
      <form className="auth-form" onSubmit={handleSubmit} aria-busy={busy}><div className="form-field"><label htmlFor="reset-email">E-mail da sua conta</label><input id="reset-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="voce@exemplo.com" /></div>{error && <p className="form-message form-error" role="alert">{error}</p>}<button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar link de recuperação'}<Icon name="arrow" /></button></form>
      <a className="auth-return-link" href="/login"><Icon name="back" />Lembrei! Voltar para o login</a>
    </>}
  </AuthLayout>;
}
