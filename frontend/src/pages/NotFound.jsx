import { useEffect } from 'react';
import Brand from '../components/Brand.jsx';
import Icon from '../components/Icon.jsx';
import './NotFound.css';

export default function NotFound() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Página não encontrada — Talenty';
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="not-found-page">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="container not-found-header">
        <Brand href="/" />
        <a className="not-found-home-link" href="/">Ir para o início <span aria-hidden="true">↗</span></a>
      </header>

      <main id="conteudo" className="container not-found-main">
        <div className="not-found-art" aria-hidden="true">
          <span className="not-found-sticker">opa, caminho errado ✦</span>
          <span className="not-found-code">4<span>0</span>4</span>
          <span className="not-found-search"><Icon name="search" /></span>
        </div>

        <span className="not-found-label">ERRO 404 · PÁGINA NÃO ENCONTRADA</span>
        <h1>Essa página deu uma <span className="highlight">fugidinha.</span></h1>
        <p>O link pode ter mudado ou a página não existe mais. Mas teu próximo freela pode estar logo ali.</p>
        <div className="not-found-actions">
          <a className="button button-primary" href="/">Voltar para o início <span aria-hidden="true">↗</span></a>
          <a className="button button-outline" href="/#categorias">Explorar freelas</a>
        </div>
      </main>

      <footer className="not-found-footer">
        <p>Feito por e para estudantes no Brasil. <span aria-hidden="true">✦</span></p>
      </footer>
    </div>
  );
}
