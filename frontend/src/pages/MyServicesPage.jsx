import AppLayout, { Private, Notice } from "../components/AppLayout.jsx";
import useApi from "../hooks/useApi.js";
import { api, money } from "../services/api.js";
import { useState } from "react";
import usePageTitle from "../hooks/usePageTitle.js";
function Services() {
  const { data, error, loading, reload } = useApi("/me/servicos", true);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  async function pause(id) {
    setBusy(true);
    setFailure("");
    try {
      await api(`/servicos/${id}`, { method: "DELETE", protected: true });
      reload();
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Teus talentos em destaque.</h1>
      <p className="workspace-muted">
        Gerencie até 100 anúncios recentes. Para pausar um serviço, desmarque
        “Anúncio ativo” na edição.
      </p>
      <div className="workspace-actions">
        <a className="button button-primary" href="/servicos/novo">
          + Novo serviço
        </a>
      </div>
      <Notice error={error || failure} />
      {error && (
        <button onClick={reload} className="button">
          Tentar novamente
        </button>
      )}
      {loading && <p role="status">Carregando…</p>}
      <div className="workspace-list">
        {data?.map((s) => (
          <article key={s.id} className="workspace-panel">
            <span className="workspace-badge">
              {s.ativo ? "Publicado" : "Pausado"}
            </span>
            <h2>{s.titulo}</h2>
            <p>
              {money(s.preco_centavos)} · {s.prazo_dias} dias
            </p>
            <a href={`/servicos/${s.id}/editar`}>Editar serviço →</a>
            {s.ativo && (
              <div className="workspace-actions">
                <a href={`/servicos/${s.id}`}>Ver anúncio</a>
                <button
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => pause(s.id)}
                >
                  Pausar anúncio
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {data?.length === 0 && (
        <section className="workspace-panel">
          <h2>Seu primeiro anúncio começa aqui.</h2>
          <p>Compartilhe uma habilidade com a comunidade.</p>
        </section>
      )}
    </>
  );
}
export default function MyServicesPage() {
  usePageTitle("Meus serviços");
  return (
    <AppLayout>
      <Private>
        <Services />
      </Private>
    </AppLayout>
  );
}
