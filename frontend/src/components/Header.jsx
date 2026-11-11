import Brand from "./Brand.jsx";

export default function Header() {
  return (
    <header className="container site-header">
      <div className="header-brand"><Brand /></div>
      <nav className="desktop-nav" aria-label="Navegação principal">
        <a href="#como-funciona">Como funciona</a>
        <a href="#categorias">Categorias</a>
      </nav>
      <div className="header-actions">
        <a className="login-button" href="/login">Entrar</a>
        <a className="button button-ink" href="/cadastro">Criar conta</a>
      </div>
    </header>
  );
}
