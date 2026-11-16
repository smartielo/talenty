import { useEffect, useMemo, useState } from "react";
import AppLayout, { Notice } from "../components/AppLayout.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import { api } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";

export default function FeedPage() {
  usePageTitle("Anúncios");
  const params = new URLSearchParams(location.search);
  const search = (params.get("q") || "").trim();
  const [category, setCategory] = useState(params.get("categoria") || "");
  const [catalog, setCatalog] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Catálogo e anúncios são independentes, então são buscados em paralelo.
    let active = true;
    Promise.all([api("/catalogo"), api("/servicos")])
      .then(([catalogData, services]) => {
        if (!active) return;
        setCatalog(catalogData.categorias);
        setItems(services);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    // A busca é feita no navegador neste MVP. Em uma base grande, pesquisa e
    // paginação devem migrar para o backend ou para um serviço de busca.
    const term = search.toLocaleLowerCase("pt-BR");
    return items.filter((item) => {
      const matchesCategory = !category || item.categoria_id === category;
      const text = `${item.titulo} ${item.descricao} ${item.prestador_nome}`
        .toLocaleLowerCase("pt-BR");
      return matchesCategory && (!term || text.includes(term));
    });
  }, [category, items, search]);

  return (
    <AppLayout>
      <p className="workspace-muted">TUA COMUNIDADE, TEUS TALENTOS</p>
      <h1>Anúncios da comunidade.</h1>
      <p className="workspace-muted">Pesquise uma habilidade ou filtre por categoria.</p>

      <div className="workspace-tabs" aria-label="Filtrar por categoria">
        <button className={!category ? "selected" : ""} onClick={() => setCategory("")}>
          Todas
        </button>
        {catalog.map((item) => (
          <button
            key={item.id}
            className={category === item.id ? "selected" : ""}
            onClick={() => setCategory(item.id)}
          >
            {item.nome}
          </button>
        ))}
      </div>

      <Notice error={error} />
      {search ? <p className="workspace-muted">Resultado da pesquisa por “{search}”.</p> : null}
      {loading ? <p role="status">Carregando anúncios…</p> : null}
      {filtered.map((item) => <ServiceCard key={item.id} service={item} />)}

      {!loading && !error && filtered.length === 0 ? (
        <section className="workspace-panel">
          <h2>Nenhum anúncio encontrado.</h2>
          <p>Tente outra pesquisa ou publique o primeiro anúncio desta categoria.</p>
          <a href="/servicos/novo" className="button button-primary">Criar anúncio</a>
        </section>
      ) : null}
    </AppLayout>
  );
}
