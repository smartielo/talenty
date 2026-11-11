import AppLayout, { Notice } from "../components/AppLayout.jsx";
import useApi from "../hooks/useApi.js";
import { money } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";

export default function ServiceDetailPage({ id }) {
  usePageTitle("Anúncio");
  const { data: service, error, loading } = useApi(`/servicos/${id}`);

  return (
    <AppLayout>
      <Notice error={error} />
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
            <a href="/home" className="button button-primary">Voltar aos anúncios</a>
          </section>
        </>
      ) : null}
    </AppLayout>
  );
}
