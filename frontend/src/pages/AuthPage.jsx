import { useState } from 'react';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';
import SignupForm from '../components/auth/SignupForm.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function AuthPage({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const signup = mode === 'signup';
  const { user, loading, configured } = useAuth();
  usePageTitle(signup ? 'Criar conta' : 'Entrar');
  function switchMode(nextMode) {
    setMode(nextMode);
    window.history.replaceState(null, '', nextMode === 'signup' ? '/cadastro' : '/login');
  }
  return <AuthLayout>
    <span className="auth-eyebrow">BORA FAZER ACONTECER</span>
    <h1>{signup ? 'Teu talento merece' : 'Bom te ver'}<br /><span className="highlight">{signup ? 'ser visto.' : 'por aqui.'}</span></h1>
    <p className="auth-intro">{signup ? 'Crie sua conta e encontre seu espaço na comunidade.' : 'Entra na tua conta. Tem muita coisa boa te esperando.'}</p>
    <div className="auth-mode-switch" aria-label="Escolher formulário"><button type="button" className={!signup ? 'active' : ''} aria-pressed={!signup} onClick={() => switchMode('login')}>Entrar</button><button type="button" className={signup ? 'active' : ''} aria-pressed={signup} onClick={() => switchMode('signup')}>Criar conta</button></div>
    {user && !loading && <p className="form-message form-success">Você já está conectado. <a href="/home">Ir para o feed →</a></p>}
    {!configured && <p className="auth-demo-notice">As contas ainda não estão disponíveis. Enquanto isso, conheça o feed de demonstração.</p>}
    {signup ? <SignupForm /> : <LoginForm />}
    <div className="auth-divider"><span>ou chega mais, sem compromisso</span></div>
    <a className="button button-outline auth-demo-link" href="/home">Explorar o feed de demonstração</a>
    <p className="auth-switch-note">{signup ? 'Já faz parte da comunidade?' : 'Ainda não tem uma conta?'} <button type="button" onClick={() => switchMode(signup ? 'login' : 'signup')}>{signup ? 'Entrar' : 'Vem pra Talenty'}</button></p>
  </AuthLayout>;
}
