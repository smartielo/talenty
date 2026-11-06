import { useEffect, useState } from "react";
import Brand from "./Brand.jsx";
import Icon from "./Icon.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { logout } from "../services/auth.js";
import { api } from "../services/api.js";
import "../pages/Feed.css";
import "../pages/Workspace.css";
const links = [
  ["/home", "home", "Início"],
  ["/home?aba=salvos", "bookmark", "Salvos"],
  ["/pedidos", "bag", "Meus pedidos"],
  ["/mensagens", "message", "Mensagens"],
  ["/meus-servicos", "plus", "Meus serviços"],
  ["/perfil", "user", "Meu perfil"],
];
export default function AppLayout({ children, aside }) {
  const { user } = useAuth();
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    if (user)
      api("/auth/me", { protected: true })
        .then((data) => {
          if (current) setAdmin(data.usuario.papel === "ADMIN");
        })
        .catch(() => {});
    return () => {
      current = false;
    };
  }, [user]);
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
              aria-label="Pesquisar serviços"
              placeholder="Buscar entre os serviços carregados..."
              defaultValue={new URLSearchParams(location.search).get("q") || ""}
            />
          </form>
          <div className="workspace-header-actions">
            <a href="/servicos/novo" aria-label="Anunciar um serviço">
              <Icon name="plus" />
            </a>
            <a className="workspace-avatar" href={user ? "/perfil" : "/login"}>
              {user ? (
                (user.displayName || "T")[0].toUpperCase()
              ) : (
                <Icon name="user" />
              )}
            </a>
          </div>
        </div>
      </header>
      <div className="feed-layout">
        <aside className="feed-sidebar workspace-sidebar">
          <nav aria-label="Menu principal">
            {links.map(([href, icon, label]) => (
              <a
                key={href}
                href={href}
                className={
                  location.pathname + location.search === href ? "selected" : ""
                }
              >
                <Icon name={icon} />
                {label}
              </a>
            ))}
            {admin && (
              <a href="/admin">
                <Icon name="badge" />
                Administração
              </a>
            )}
          </nav>
          <a className="button button-primary" href="/servicos/novo">
            Anunciar um serviço
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
          {aside || (
            <>
              <div className="workspace-promo">
                <span>TUA COMUNIDADE, TEUS TALENTOS</span>
                <h2>Teu talento pode ser o próximo destaque.</h2>
                <p>
                  Compartilha o que você faz e encontra quem precisa de você.
                </p>
                <a href="/servicos/novo" className="button button-primary">
                  Quero anunciar →
                </a>
              </div>
              <p className="workspace-note">
                Pagamentos são simulados para fins acadêmicos.
              </p>
              <a href="/">Conheça a Talenty →</a>
            </>
          )}
        </aside>
      </div>
      <nav className="workspace-mobile" aria-label="Menu móvel">
        {links
          .filter((_, i) => i !== 4)
          .map(([href, icon, label]) => (
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
  if (error)
    return (
      <p className="workspace-error" role="alert">
        Não foi possível verificar sua sessão. Recarregue a página.
      </p>
    );
  if (!user)
    return (
      <section className="workspace-panel">
        <h1>Entra pra continuar.</h1>
        <p>Os teus projetos ficam ligados à tua conta.</p>
        <a className="button button-primary" href="/login">
          Entrar ou cadastrar
        </a>
      </section>
    );
  return children;
}
export function Notice({ error, message }) {
  return (
    <>
      {error && (
        <p className="workspace-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="workspace-success" role="status">
          {message}
        </p>
      )}
    </>
  );
}
