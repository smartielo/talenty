import { useEffect, useState } from "react";
import AppLayout, { Notice } from "../components/AppLayout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import useApi from "../hooks/useApi.js";
import { api, money } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";

const statusText = {
  PENDENTE: "Seu interesse foi enviado. Aguarde a resposta do anunciante.",
  RECUSADO: "O anunciante não aceitou este interesse.",
};

export default function ServiceDetailPage({ id }) {
  usePageTitle("Anúncio");
  const { user, loading: authLoading } = useAuth();
  const { data: service, error, loading } = useApi(`/servicos/${id}`);
  const [interest, setInterest] = useState(null);
  const [interestLoaded, setInterestLoaded] = useState(false);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // O anúncio é público, mas o estado do interesse pertence ao usuário
    // autenticado. Por isso ele é carregado em uma segunda chamada protegida.
    if (authLoading || !service) return;
    if (!user || service.prestador_uid === user.uid) {
      setInterestLoaded(true);
      return;
    }
    setInterestLoaded(false);
    let active = true;
    api(`/servicos/${id}/meu-interesse`, { protected: true })
      .then((data) => { if (active) setInterest(data); })
      .catch((requestError) => { if (active) setFailure(requestError.message); })
      .finally(() => { if (active) setInterestLoaded(true); });
    return () => { active = false; };
  }, [authLoading, id, service, user]);

  async function showInterest() {
    // A API cria no máximo um interesse por usuário/anúncio. Cliques repetidos
    // devolvem o mesmo registro, sem duplicar pessoas na contagem do dono.
    setBusy(true);
    setFailure("");
    try {
      const data = await api(`/servicos/${id}/interesses`, {
        method: "POST",
        protected: true,
      });
      setInterest(data);
    } catch (requestError) {
      setFailure(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function interestAction() {
    // Um único espaço da tela representa todos os estados possíveis do fluxo.
    if (authLoading) return <p role="status">Verificando sua conta…</p>;
    if (!user) {
      return <a href="/login" className="button button-primary">Entre para demonstrar interesse</a>;
    }
    if (service.prestador_uid === user.uid) {
      return <a href="/meus-servicos" className="button button-secondary">Gerenciar interessados</a>;
    }
    if (!interestLoaded) return <p role="status">Verificando seu interesse…</p>;
    if (!interest) {
      return <button className="button button-primary" disabled={busy} onClick={showInterest}>
        {busy ? "Enviando…" : "Tenho interesse"}
      </button>;
    }
    if (interest.status === "ACEITO") {
      // whatsapp_url só existe quando o backend confirmou o aceite. O telefone
      // nunca é calculado ou descoberto pelo frontend antes disso.
      return <a className="button button-whatsapp" href={interest.whatsapp_url} target="_blank" rel="noreferrer">
        Conversar pelo WhatsApp
      </a>;
    }
    return <p className={`workspace-interest-status ${interest.status.toLowerCase()}`}>
      {statusText[interest.status]}
    </p>;
  }

  return (
    <AppLayout>
      <Notice error={error || failure} />
      {loading ? <p role="status">Carregando anúncio…</p> : null}
      {service ? (
        <>
          <div className={`workspace-art ${service.categoria_id}`}>
            <span>{service.categoria_id}</span>
            <strong>{service.titulo}</strong>
          </div>
          <section className="workspace-panel">
            <h1>{service.titulo}</h1>
            <p>Publicado por <strong>{service.prestador_nome}</strong></p>
            <p className="workspace-detail">{service.descricao}</p>
            <h2>{money(service.preco_centavos)}{service.unidade === "HORA" ? " / hora" : ""}</h2>
            <p>Prazo anunciado: {service.prazo_dias} dias.</p>
            <div className="workspace-actions">
              {interestAction()}
              <a href="/home" className="button button-outline">Voltar aos anúncios</a>
            </div>
            <p className="workspace-field-help">
              O telefone do anunciante só aparece depois que ele aceitar seu interesse.
            </p>
          </section>
        </>
      ) : null}
    </AppLayout>
  );
}
