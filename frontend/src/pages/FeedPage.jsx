import { useEffect, useState } from "react";
import AppLayout, { Notice } from "../components/AppLayout.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import { api } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { useAuth } from "../contexts/AuthContext.jsx";
export default function FeedPage() {
  usePageTitle("Início");
  const { user, loading: authLoading } = useAuth();
  const params = new URLSearchParams(location.search);
  const saved = params.get("aba") === "salvos";
  const [category, setCategory] = useState(params.get("categoria") || "");
  const [catalog, setCatalog] = useState([]);
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState([]);
  useEffect(() => {
    let active = true;
    setSavedIds([]);
    if (user)
      api("/me/salvos", { protected: true })
        .then((rows) => {
          if (active) setSavedIds(rows.map((s) => s.id));
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);
  const query = (params.get("q") || "").toLocaleLowerCase("pt-BR");
  useEffect(() => {
    let active = true;
    api("/catalogo")
      .then((data) => {
        if (active) setCatalog(data.categorias);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (saved && authLoading) return;
    let active = true;
    setLoading(true);
    setError("");
    setItems([]);
    setNext(null);
    api(
      saved
        ? "/me/salvos"
        : `/servicos?${new URLSearchParams(category ? { categoria: category } : {})}`,
      { protected: saved },
    )
      .then((data) => {
        if (active) {
          setItems(saved ? data : data.itens);
          setNext(saved ? null : data.proximo);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, saved, user?.uid, authLoading]);
  async function more() {
    setLoading(true);
    setError("");
    try {
      const data = await api(
        `/servicos?${new URLSearchParams({ depois: next, ...(category ? { categoria: category } : {}) })}`,
      );
      setItems((old) => [...old, ...data.itens]);
      setNext(data.proximo);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  const filtered = items.filter((s) =>
    `${s.titulo} ${s.descricao} ${s.prestador?.nome_publico || ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(query),
  );
  return (
    <AppLayout>
      <p className="workspace-muted">TUA COMUNIDADE, TEUS TALENTOS</p>
      <h1>{saved ? "Teus serviços salvos." : "Teu próximo freela tá aqui."}</h1>
      <p className="workspace-muted">
        Gente da facul criando, compartilhando e fazendo acontecer.
      </p>
      {!saved && (
        <div className="workspace-tabs" aria-label="Categorias">
          <button
            className={!category ? "selected" : ""}
            onClick={() => setCategory("")}
          >
            Pra você
          </button>
          {catalog.map((c) => (
            <button
              key={c.id}
              className={category === c.id ? "selected" : ""}
              onClick={() => setCategory(c.id)}
            >
              {c.nome}
            </button>
          ))}
        </div>
      )}
      <Notice error={error} />
      {saved && !user && !authLoading && (
        <a href="/login" className="button button-primary">
          Entrar
        </a>
      )}
      {query && (
        <p className="workspace-muted">
          Pesquisa por “{params.get("q")}” nos anúncios carregados. Use
          “Carregar mais” para ampliar a busca.
        </p>
      )}
      {filtered.map((item) => (
        <ServiceCard
          key={item.id}
          service={item}
          saved={saved || savedIds.includes(item.id)}
          onRemoved={() =>
            setItems((old) => old.filter((s) => s.id !== item.id))
          }
        />
      ))}
      {loading && <p role="status">Carregando serviços…</p>}
      {!loading && !error && !filtered.length && (
        <section className="workspace-panel">
          <h2>
            {query || category
              ? "Nenhum serviço encontrado."
              : "Os próximos talentos começam aqui."}
          </h2>
          <p>
            {saved
              ? "Salve um serviço para encontrar ele depois."
              : "Publique o primeiro serviço da comunidade ou tente outra pesquisa."}
          </p>
          <a href="/servicos/novo" className="button button-primary">
            Anunciar um serviço
          </a>
        </section>
      )}
      {next && (
        <button
          className="button button-primary"
          disabled={loading}
          onClick={more}
        >
          Carregar mais
        </button>
      )}
    </AppLayout>
  );
}
