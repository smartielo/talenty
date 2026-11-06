import { useState } from "react";
import AppLayout, { Notice } from "../components/AppLayout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import useApi from "../hooks/useApi.js";
import { api, money } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";
export default function ServiceDetailPage({ id }) {
  usePageTitle("Serviço");
  const { user } = useAuth();
  const { data: s, error, loading } = useApi(`/servicos/${id}`);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  async function request(e) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    try {
      const p = await api("/pedidos", {
        method: "POST",
        protected: true,
        body: { servico_id: id, descricao_solicitacao: text },
      });
      location.href = `/pedidos/${p.id}`;
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppLayout>
      <Notice error={error} />
      {loading && <p role="status">Carregando serviço…</p>}
      {s && (
        <>
          <div className={`workspace-art ${s.categoria_id}`}>
            <span>{s.categoria_id}</span>
            <strong>{s.titulo}</strong>
          </div>
          <section className="workspace-panel">
            <h1>{s.titulo}</h1>
            <a href={`/prestadores/${s.prestador_uid}`}>
              Por {s.prestador?.nome_publico} {s.prestador?.verificado && "✓"}
            </a>
            <p className="workspace-detail">{s.descricao}</p>
            <h2>
              {money(s.preco_centavos)}
              {s.unidade === "HORA" && " / hora"}
            </h2>
            <p>
              Prazo anunciado: {s.prazo_dias} dias. O valor total será
              confirmado no orçamento.
            </p>
            {user?.uid === s.prestador_uid ? (
              <a
                href={`/servicos/${id}/editar`}
                className="button button-primary"
              >
                Editar meu serviço
              </a>
            ) : user ? (
              <form className="workspace-form" onSubmit={request}>
                <h2>Conta tua ideia.</h2>
                <label>
                  O que você precisa?
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    minLength={10}
                    maxLength={4000}
                    placeholder="Explique o projeto, o prazo desejado e os detalhes importantes."
                  />
                </label>
                <Notice error={failure} />
                <button disabled={busy} className="button button-primary">
                  Solicitar orçamento
                </button>
                <p className="workspace-muted">
                  O pedido abre uma conversa com o prestador. Nenhuma cobrança
                  real será feita.
                </p>
              </form>
            ) : (
              <a href="/login" className="button button-primary">
                Entrar para solicitar
              </a>
            )}
          </section>
        </>
      )}
    </AppLayout>
  );
}
