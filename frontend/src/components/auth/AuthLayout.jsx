import Brand from '../Brand.jsx';
import Icon from '../Icon.jsx';
import '../../pages/Auth.css';

export default function AuthLayout({ children }) {
  return <div className="auth-page">
    <a className="skip-link" href="#auth-content">Pular para o formulário</a>
    <aside className="auth-story" aria-label="Bem-vindo à Talenty">
      <Brand href="/" />
      <div className="auth-story-copy"><span className="auth-sticker">teu talento tem lugar aqui ✦</span><h2>Da facul pro<br /><span>próximo freela.</span></h2><p>Conecta com quem entende tua rotina. Encontra talentos, compartilha o que sabe e faz acontecer.</p>
        <div className="auth-photo"><img src="/images/campus.jpg" alt="Universitários conversando no campus" width="800" height="600" /><span><Icon name="badge" />Uma comunidade feita de gente como você.</span></div>
      </div>
      <p className="auth-story-footer">Feito por e para estudantes no Brasil.</p>
    </aside>
    <div className="auth-form-side"><header className="auth-mobile-brand"><Brand href="/" /></header><a className="auth-back-link" href="/"><Icon name="back" />Voltar para o início</a><main id="auth-content" className="auth-content">{children}</main><footer className="auth-page-footer">Um talento, muitas possibilidades. ✦</footer></div>
  </div>;
}
