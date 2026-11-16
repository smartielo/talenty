import AppLayout, { Notice, Private } from "../components/AppLayout.jsx";
import Icon from "../components/Icon.jsx";
import useApi from "../hooks/useApi.js";
import usePageTitle from "../hooks/usePageTitle.js";

const labels = {
  PENDENTE: "Aguardando resposta",
  ACEITO: "Aceito",
  RECUSADO: "Não aceito",
};

function Interests() {
  // A resposta já vem filtrada pelo UID do token. Para itens aceitos, ela
  // também inclui whatsapp_url; pendentes e recusados nunca recebem o contato.
  const { data, error, loading } = useApi("/me/interesses", true);

  return (
    <>
      <h1>Meus interesses.</h1>
      <p className="workspace-muted">
        Acompanhe as respostas dos anunciantes e acesse o WhatsApp quando seu interesse for aceito.
      </p>
      <Notice error={error} />
      {loading ? <p role="status">Carregando interesses…</p> : null}
      {data?.length > 0 ? (
        <div className="workspace-list workspace-spaced-list">
          {data.map((interest) => (
          <article className="workspace-panel" key={interest.id}>
            <div className="workspace-card-heading">
              <div>
                <span className={`workspace-status ${interest.status.toLowerCase()}`}>
                  {labels[interest.status]}
                </span>
                <h2>{interest.servico_titulo}</h2>
                <p className="workspace-muted">Anunciante: {interest.prestador_nome}</p>
              </div>
            </div>
            {interest.status === "PENDENTE" ? (
              <p>O anunciante ainda está analisando seu interesse.</p>
            ) : null}
            {interest.status === "RECUSADO" ? (
              <p>O anunciante decidiu não liberar o contato para este pedido.</p>
            ) : null}
            {interest.status === "ACEITO" ? (
              <div className="workspace-contact-box">
                <p>Seu interesse foi aceito. Agora vocês podem combinar os detalhes.</p>
                <a className="button button-whatsapp" href={interest.whatsapp_url} target="_blank" rel="noreferrer">
                  Conversar pelo WhatsApp
                </a>
              </div>
            ) : null}
            <div className="workspace-actions">
              <a href={`/servicos/${interest.servico_id}`}>Ver anúncio</a>
            </div>
          </article>
          ))}
        </div>
      ) : null}
      {!loading && data?.length === 0 ? (
        <section className="workspace-panel workspace-empty-state">
          <span className="workspace-empty-icon"><Icon name="heart" /></span>
          <div>
            <h2>Você ainda não demonstrou interesse.</h2>
            <p>Explore os anúncios e encontre uma habilidade que combine com o que você precisa.</p>
            <a className="button button-primary" href="/home">Explorar anúncios</a>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default function InterestsPage() {
  usePageTitle("Meus interesses");
  return <AppLayout><Private><Interests /></Private></AppLayout>;
}
