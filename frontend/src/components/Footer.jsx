import Brand from './Brand.jsx';
import Icon from './Icon.jsx';

export default function Footer({ onInfo }) {
  return <footer className="site-footer"><div className="container footer-grid">
    <div className="footer-brand-column"><Brand footer /><p>Freelas de universitários verificados, com pagamento protegido até a entrega.</p><span className="footer-protection"><Icon name="check" />Pagamento protegido</span></div>
    <nav className="footer-links" aria-label="Plataforma"><h3>Plataforma</h3><a href="#como-funciona">Como funciona</a><a href="#categorias">Categorias</a><button type="button" onClick={() => onInfo('verification')}>Verificação de estudantes</button><button type="button" onClick={() => onInfo('pricing')}>Preços e taxas</button></nav>
    <nav className="footer-links" aria-label="Ajuda"><h3>Ajuda</h3><button type="button" onClick={() => onInfo('help')}>Central de ajuda</button><a href="#pagamento-seguro">Segurança e reembolso</a><button type="button" onClick={() => onInfo('contact')}>Fale conosco</button><button type="button" onClick={() => onInfo('terms')}>Termos e privacidade</button></nav>
    <div className="footer-newsletter"><h3>Receba oportunidades</h3><form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); onInfo('newsletter'); }}><label className="sr-only" htmlFor="newsletter-email">Seu melhor e-mail</label><input id="newsletter-email" type="email" autoComplete="email" placeholder="Seu melhor e-mail" required /><button type="submit">Assinar</button></form><p>Feito por estudantes e para estudantes no Brasil.</p></div>
  </div><div className="footer-bottom"><div className="container"><span>© 2026 Talenty. Todos os direitos reservados.</span><span>Projeto acadêmico · Brasil</span></div></div></footer>;
}
