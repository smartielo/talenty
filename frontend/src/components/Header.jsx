import { useState } from 'react';
import Brand from './Brand.jsx';
import Icon from './Icon.jsx';

const links = [['Como funciona', '#como-funciona'], ['Categorias', '#categorias'], ['Comunidade', '#comunidade'], ['Pagamento seguro', '#pagamento-seguro']];

export default function Header({ onTutoring }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="container site-header">
    <div className="header-brand"><Brand /><button type="button" className="new-badge" onClick={onTutoring}>novo ✦ vagas de monitoria</button></div>
    <nav className="desktop-nav" aria-label="Navegação principal">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
    <div className="header-actions"><a className="login-button" href="/login">Entrar</a><a className="button button-ink" href="/cadastro">Quero vender</a><button type="button" className="icon-button mobile-menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button></div>
    {menuOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="Navegação móvel">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav>}
  </header>;
}
