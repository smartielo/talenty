import { useEffect, useState } from "react";
import { api, money } from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Notice } from "./AppLayout.jsx";
export default function ServiceCard({ service: s, saved = false, onRemoved }) {
  const { user } = useAuth();
  const [isSaved, setSaved] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setSaved(saved);
  }, [saved]);
  async function save() {
    if (!user) {
      location.href = "/login";
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`/me/salvos/${s.id}`, {
        method: isSaved ? "DELETE" : "PUT",
        protected: true,
      });
      setSaved(!isSaved);
      if (isSaved) onRemoved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="workspace-post">
      <a
        href={`/prestadores/${s.prestador_uid}`}
        className="workspace-post-header"
      >
        <span className="workspace-avatar">
          {(s.prestador?.nome_publico || "T")[0]}
        </span>
        <div>
          <strong>
            {s.prestador?.nome_publico || "Estudante"}{" "}
            {s.prestador?.verificado && (
              <span title="Vínculo estudantil verificado">✓</span>
            )}
          </strong>
          <p>
            {s.prestador?.curso} · {s.prestador?.cidade}
          </p>
        </div>
      </a>
      <a
        href={`/servicos/${s.id}`}
        className={`workspace-art ${s.categoria_id}`}
      >
        <span>{s.categoria_id} / Talenty</span>
        <strong>{s.titulo}</strong>
      </a>
      <div className="workspace-post-body">
        <h2>
          <a href={`/servicos/${s.id}`}>{s.titulo}</a>
        </h2>
        <p>
          {s.descricao.slice(0, 180)}
          {s.descricao.length > 180 && "…"}
        </p>
        <span className="workspace-muted">Prazo: {s.prazo_dias} dias</span>
        <div className="workspace-post-bottom">
          <strong>
            {money(s.preco_centavos)}
            {s.unidade === "HORA" && " / hora"}
          </strong>
          <div className="workspace-actions">
            <button
              className="button button-secondary"
              onClick={save}
              disabled={busy}
              aria-pressed={isSaved}
            >
              {isSaved ? "Salvo ✓" : "Salvar"}
            </button>
            <a className="button button-primary" href={`/servicos/${s.id}`}>
              Ver serviço →
            </a>
          </div>
        </div>
        <Notice error={error} />
      </div>
    </article>
  );
}
