import Brand from "./Brand.jsx";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-column">
          <Brand footer />
          <p>Projeto acadêmico para divulgação de serviços entre estudantes.</p>
        </div>
        <nav className="footer-links" aria-label="Plataforma">
          <h3>Plataforma</h3>
          <a href="/home">Ver anúncios</a>
          <a href="/servicos/novo">Criar anúncio</a>
        </nav>
        <nav className="footer-links" aria-label="Conta">
          <h3>Conta</h3>
          <a href="/login">Entrar</a>
          <a href="/cadastro">Cadastrar</a>
        </nav>
      </div>
      <div className="footer-bottom">
        <div className="container"><span>© 2026 Talenty</span><span>UNISAGRADO</span></div>
      </div>
    </footer>
  );
}
