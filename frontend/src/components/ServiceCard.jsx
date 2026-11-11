import { money } from "../services/api.js";

export default function ServiceCard({ service }) {
  return (
    <article className="workspace-post">
      <div className="workspace-post-header">
        <span className="workspace-avatar">{service.prestador_nome[0].toUpperCase()}</span>
        <div>
          <strong>{service.prestador_nome}</strong>
          <p>Autor do anúncio</p>
        </div>
      </div>
      <a href={`/servicos/${service.id}`} className={`workspace-art ${service.categoria_id}`}>
        <span>{service.categoria_id} / Talenty</span>
        <strong>{service.titulo}</strong>
      </a>
      <div className="workspace-post-body">
        <h2><a href={`/servicos/${service.id}`}>{service.titulo}</a></h2>
        <p>{service.descricao.slice(0, 180)}{service.descricao.length > 180 ? "…" : ""}</p>
        <span className="workspace-muted">Prazo: {service.prazo_dias} dias</span>
        <div className="workspace-post-bottom">
          <strong>{money(service.preco_centavos)}{service.unidade === "HORA" ? " / hora" : ""}</strong>
          <a className="button button-primary" href={`/servicos/${service.id}`}>Ver anúncio →</a>
        </div>
      </div>
    </article>
  );
}
