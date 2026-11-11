import { useState } from "react";
import AppLayout, { Notice, Private } from "../components/AppLayout.jsx";
import useApi from "../hooks/useApi.js";
import { api, money } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";

function Services() {
  const { data, error, loading, reload } = useApi("/me/servicos", true);
  const [failure, setFailure] = useState("");
  const [busyId, setBusyId] = useState("");

  async function remove(service) {
    if (!window.confirm(`Excluir definitivamente o anúncio “${service.titulo}”?`)) return;
    setBusyId(service.id);
    setFailure("");
    try {
      await api(`/servicos/${service.id}`, { method: "DELETE", protected: true });
      reload();
    } catch (removeError) {
      setFailure(removeError.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <h1>Meus anúncios.</h1>
      <p className="workspace-muted">Crie e exclua os anúncios vinculados à sua conta.</p>
      <div className="workspace-actions">
        <a className="button button-primary" href="/servicos/novo">+ Novo anúncio</a>
      </div>
      <Notice error={error || failure} />
      {loading ? <p role="status">Carregando…</p> : null}
      <div className="workspace-list">
        {data?.map((service) => (
          <article key={service.id} className="workspace-panel">
            <h2>{service.titulo}</h2>
            <p>{money(service.preco_centavos)} · {service.prazo_dias} dias</p>
            <div className="workspace-actions">
              <a href={`/servicos/${service.id}`}>Ver anúncio</a>
              <button
                className="button button-secondary"
                disabled={busyId === service.id}
                onClick={() => remove(service)}
              >
                {busyId === service.id ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!loading && data?.length === 0 ? (
        <section className="workspace-panel">
          <h2>Você ainda não publicou anúncios.</h2>
          <p>Use o botão acima para criar o primeiro.</p>
        </section>
      ) : null}
    </>
  );
}

export default function MyServicesPage() {
  usePageTitle("Meus anúncios");
  return <AppLayout><Private><Services /></Private></AppLayout>;
}
