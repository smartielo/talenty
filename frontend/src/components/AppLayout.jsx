import { useState } from "react";
import Brand from "./Brand.jsx";
import Icon from "./Icon.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { logout } from "../services/auth.js";
import "../pages/Feed.css";
import "../pages/Workspace.css";

const links = [
  ["/home", "home", "Anúncios"],
  ["/meus-servicos", "plus", "Meus anúncios"],
];

export default function AppLayout({ children }) {
  const { user } = useAuth();
  const [error, setError] = useState("");

  async function sair() {
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      setError("Não foi possível sair. Tente novamente.");
    }
  }

  return (
    <div className="feed-page">
      <header className="feed-header">
        <div className="feed-header-inner">
          <Brand href="/home" />
          <form action="/home" className="workspace-search">
            <Icon name="search" />
            <input
              name="q"
              aria-label="Pesquisar anúncios"
              placeholder="Buscar por título, descrição ou autor..."
              defaultValue={new URLSearchParams(location.search).get("q") || ""}
            />
          </form>
          <div className="workspace-header-actions">
            <a href="/servicos/novo" aria-label="Criar anúncio">
              <Icon name="plus" />
            </a>
            <a className="workspace-avatar" href={user ? "/meus-servicos" : "/login"}>
              {user ? (user.displayName || "T")[0].toUpperCase() : <Icon name="user" />}
            </a>
          </div>
        </div>
      </header>

      <div className="feed-layout">
        <aside className="feed-sidebar workspace-sidebar">
          <nav aria-label="Menu principal">
            {links.map(([href, icon, label]) => (
              <a key={href} href={href} className={location.pathname === href ? "selected" : ""}>
                <Icon name={icon} />
                {label}
              </a>
            ))}
          </nav>
          <a className="button button-primary" href="/servicos/novo">
            Criar anúncio
          </a>
          <div className="workspace-account">
            {user ? (
              <>
                <strong>{user.displayName || "Sua conta"}</strong>
                <button type="button" onClick={sair}>
                  Sair <Icon name="logout" />
                </button>
              </>
            ) : (
              <a href="/login">Entrar ou cadastrar</a>
            )}
            {error && <p role="alert">{error}</p>}
          </div>
        </aside>

        <main className="feed-main workspace-main" id="conteudo">
          {children}
        </main>

        <aside className="feed-right workspace-right">
          <div className="workspace-promo">
            <span>PROJETO ACADÊMICO</span>
            <h2>Compartilhe uma habilidade.</h2>
            <p>Crie uma conta, publique um anúncio e encontre talentos.</p>
            <a href="/servicos/novo" className="button button-primary">
              Quero anunciar →
            </a>
          </div>
          <a href="/">Conheça a Talenty →</a>
        </aside>
      </div>

      <nav className="workspace-mobile" aria-label="Menu móvel">
        {links.map(([href, icon, label]) => (
          <a key={href} href={href}>
            <Icon name={icon} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

export function Private({ children }) {
  const { user, loading, error } = useAuth();
  if (loading) return <p role="status">Carregando sua conta…</p>;
  if (error) return <p className="workspace-error" role="alert">Não foi possível verificar sua sessão.</p>;
  if (!user) {
    return (
      <section className="workspace-panel">
        <h1>Entre para continuar.</h1>
        <p>Os anúncios ficam ligados à sua conta.</p>
        <a className="button button-primary" href="/login">Entrar ou cadastrar</a>
      </section>
    );
  }
  return children;
}

export function Notice({ error, message }) {
  return (
    <>
      {error ? <p className="workspace-error" role="alert">{error}</p> : null}
      {message ? <p className="workspace-success" role="status">{message}</p> : null}
    </>
  );
}
