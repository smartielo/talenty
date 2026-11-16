import { useState } from "react";
import AppLayout, { Notice, Private } from "../components/AppLayout.jsx";
import useApi from "../hooks/useApi.js";
import { api, money } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";

function Services() {
  // Esta rota devolve somente anúncios do usuário atual e já inclui as
  // contagens de interesses totais e pendentes calculadas pelo backend.
  const { data, error, loading, reload } = useApi("/me/servicos", true);
  const [failure, setFailure] = useState("");
  const [busyId, setBusyId] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [interests, setInterests] = useState({});
  const [phone, setPhone] = useState({});

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

  async function loadInterests(serviceId, force = false) {
    // Os detalhes das pessoas são carregados apenas quando o dono expande um
    // anúncio. Isso evita várias consultas desnecessárias ao abrir a página.
    if (expandedId === serviceId && !force) {
      setExpandedId("");
      return;
    }
    setExpandedId(serviceId);
    if (interests[serviceId] && !force) return;
    setBusyId(serviceId);
    setFailure("");
    try {
      const result = await api(`/me/servicos/${serviceId}/interesses`, { protected: true });
      setInterests((current) => ({ ...current, [serviceId]: result }));
    } catch (requestError) {
      setFailure(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function decide(serviceId, interestId, status) {
    // Depois da decisão, recarregamos a lista expandida e as contagens do card.
    setBusyId(interestId);
    setFailure("");
    try {
      await api(`/me/servicos/${serviceId}/interesses/${interestId}`, {
        method: "PATCH",
        protected: true,
        body: { status },
      });
      await loadInterests(serviceId, true);
      reload();
    } catch (requestError) {
      setFailure(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function savePhone(serviceId) {
    // Compatibilidade com anúncios antigos, criados antes de o telefone passar
    // a ser obrigatório no formulário de publicação.
    setBusyId(`phone-${serviceId}`);
    setFailure("");
    try {
      await api(`/servicos/${serviceId}/telefone`, {
        method: "PATCH",
        protected: true,
        body: { telefone_contato: phone[serviceId] || "" },
      });
      reload();
    } catch (requestError) {
      setFailure(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <h1>Meus anúncios.</h1>
      <p className="workspace-muted">Gerencie seus anúncios e escolha com quem compartilhar o contato.</p>
      <div className="workspace-actions">
        <a className="button button-primary" href="/servicos/novo">+ Novo anúncio</a>
      </div>
      <Notice error={error || failure} />
      {loading ? <p role="status">Carregando…</p> : null}
      <div className="workspace-list">
        {data?.map((service) => (
          <article key={service.id} className="workspace-panel">
            <div className="workspace-card-heading">
              <div>
                <h2>{service.titulo}</h2>
                <p>{money(service.preco_centavos)} · {service.prazo_dias} dias</p>
              </div>
              <div className="workspace-interest-count" aria-label={`${service.interessados_quantidade} pessoas interessadas`}>
                <strong>{service.interessados_quantidade}</strong>
                <span>{service.interessados_quantidade === 1 ? "pessoa interessada" : "pessoas interessadas"}</span>
              </div>
            </div>
            {service.interessados_pendentes > 0 ? (
              <p className="workspace-pending-note">
                {service.interessados_pendentes} {service.interessados_pendentes === 1 ? "interesse aguarda" : "interesses aguardam"} sua resposta.
              </p>
            ) : null}
            {!service.telefone_contato ? (
              <div className="workspace-phone-setup">
                <strong>Adicione um WhatsApp para receber interessados</strong>
                <p>Anúncios antigos precisam do número antes de liberar o botão de interesse.</p>
                <div className="workspace-inline-form">
                  <input
                    aria-label="Celular com WhatsApp"
                    value={phone[service.id] || ""}
                    onChange={(event) => setPhone((current) => ({ ...current, [service.id]: event.target.value }))}
                    placeholder="(14) 99999-9999"
                    inputMode="tel"
                  />
                  <button
                    className="button button-primary"
                    disabled={busyId === `phone-${service.id}`}
                    onClick={() => savePhone(service.id)}
                  >
                    {busyId === `phone-${service.id}` ? "Salvando…" : "Salvar telefone"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="workspace-private-phone">WhatsApp protegido configurado.</p>
            )}
            <div className="workspace-actions">
              <a href={`/servicos/${service.id}`}>Ver anúncio</a>
              <button
                className="button button-primary"
                disabled={busyId === service.id}
                onClick={() => loadInterests(service.id)}
              >
                {expandedId === service.id ? "Ocultar interessados" : `Ver interessados (${service.interessados_quantidade})`}
              </button>
              <button
                className="button button-secondary"
                disabled={busyId === service.id}
                onClick={() => remove(service)}
              >
                {busyId === service.id ? "Excluindo…" : "Excluir"}
              </button>
            </div>
            {expandedId === service.id ? (
              <div className="workspace-interested-list">
                {busyId === service.id && !interests[service.id] ? <p role="status">Carregando interessados…</p> : null}
                {interests[service.id]?.map((interest) => (
                  <div className="workspace-interested-person" key={interest.id}>
                    <div>
                      <strong>{interest.cliente_nome}</strong>
                      <span>{interest.cliente_email}</span>
                      <span className={`workspace-status ${interest.status.toLowerCase()}`}>
                        {interest.status === "PENDENTE" ? "Aguardando resposta" : interest.status === "ACEITO" ? "Aceito" : "Não aceito"}
                      </span>
                    </div>
                    <div className="workspace-actions">
                      <button
                        className="button button-primary"
                        disabled={busyId === interest.id || interest.status === "ACEITO"}
                        onClick={() => decide(service.id, interest.id, "ACEITO")}
                      >
                        Aceitar
                      </button>
                      <button
                        className="button button-secondary"
                        disabled={busyId === interest.id || interest.status === "RECUSADO"}
                        onClick={() => decide(service.id, interest.id, "RECUSADO")}
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
                {interests[service.id]?.length === 0 ? <p className="workspace-muted">Ninguém demonstrou interesse ainda.</p> : null}
              </div>
            ) : null}
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
