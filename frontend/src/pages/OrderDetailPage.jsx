import { useEffect, useState } from "react";
import AppLayout, { Private, Notice } from "../components/AppLayout.jsx";
import { api, money, cents } from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import useApi from "../hooks/useApi.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { statusLabel } from "./OrdersPage.jsx";

function Chat({ id }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api(`/pedidos/${id}/mensagens`, { protected: true })
      .then((data) => {
        if (active) {
          setItems(data.itens);
          setNext(data.proximo);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function refresh(more = false) {
    setLoading(true);
    setError("");
    try {
      // O cursor parte da última mensagem já vista, para buscar somente as novas.
      const cursor = more ? next : items.at(-1)?.id;
      const data = await api(
        `/pedidos/${id}/mensagens${cursor ? `?depois=${encodeURIComponent(cursor)}` : ""}`,
        { protected: true },
      );
      setItems((old) => [
        ...old,
        ...data.itens.filter((s) => !old.some((o) => o.id === s.id)),
      ]);
      setNext(data.proximo);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/pedidos/${id}/mensagens`, {
        method: "POST",
        protected: true,
        body: { texto: text },
      });
      setText("");
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-panel" id="conversa">
      <h2>A conversa do projeto.</h2>
      <p className="workspace-muted">
        As mensagens são atualizadas pelo botão abaixo.
      </p>
      {items.map((m) => (
        <div
          className={`workspace-message${m.autor_uid === user.uid ? " mine" : ""}`}
          key={m.id}
        >
          <small>
            {m.autor_uid === user.uid ? "Você" : "Outra pessoa do pedido"} ·{" "}
            {m.criado_em ? new Date(m.criado_em).toLocaleString("pt-BR") : ""}
          </small>
          {m.texto}
        </div>
      ))}
      {!loading && !items.length && (
        <p>Comece a conversa combinando os detalhes do projeto.</p>
      )}
      {loading && <p role="status">Carregando mensagens…</p>}
      <div className="workspace-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={() => refresh(Boolean(next))}
          disabled={loading}
        >
          {next ? "Carregar próximas mensagens" : "Atualizar mensagens"}
        </button>
      </div>
      <Notice error={error} />
      <form onSubmit={send} className="workspace-form">
        <label>
          Mensagem
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            maxLength={4000}
            minLength={1}
          />
        </label>
        <button className="button button-primary" disabled={busy || loading}>
          Enviar mensagem
        </button>
      </form>
    </section>
  );
}

function Order({ id }) {
  const { user } = useAuth();
  const { data: p, error, loading, reload } = useApi(`/pedidos/${id}`, true);
  const [value, setValue] = useState("");
  const [delivery, setDelivery] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  async function action(name) {
    setBusy(true);
    setFailure("");
    try {
      const body = { acao: name };
      if (name === "ORCAR") body.valor_centavos = cents(value);
      if (name === "ENTREGAR") body.entrega = delivery;
      await api(`/pedidos/${id}/acoes`, {
        method: "POST",
        protected: true,
        body,
      });
      setConfirm(null);
      reload();
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function review(e) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    try {
      await api(`/pedidos/${id}/avaliacao`, {
        method: "POST",
        protected: true,
        body: { nota: Number(rating), comentario: comment },
      });
      reload();
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">Carregando pedido…</p>;
  if (error)
    return (
      <>
        <Notice error={error} />
        <button onClick={reload} className="button">
          Tentar novamente
        </button>
      </>
    );
  const customer = user.uid === p.cliente_uid;
  return (
    <>
      <a href="/pedidos" className="workspace-muted">
        ← Meus pedidos
      </a>
      <section className="workspace-panel">
        <span className="workspace-badge">{statusLabel[p.status]}</span>
        <h1>{p.titulo_servico}</h1>
        <p className="workspace-muted">
          {customer ? "Você está contratando" : "Você está prestando o serviço"}
        </p>
        <h2>{money(p.valor_centavos)}</h2>
        <p className="workspace-detail">{p.descricao_solicitacao}</p>
        <p className="workspace-muted">
          Etapas: solicitação → orçamento → aceite → pagamento simulado →
          entrega → aprovação.
        </p>
        {p.descricao_entrega && (
          <>
            <h2>Entrega do prestador</h2>
            <p className="workspace-detail">{p.descricao_entrega}</p>
          </>
        )}
        {p.pagamento && (
          <div className="workspace-success">
            <strong>
              Pagamento simulado:{" "}
              {p.pagamento.status === "LIBERADO" ? "liberado" : "retido"}
            </strong>
            <p>
              Comissão Talenty: {money(p.pagamento.valor_comissao_centavos)}{" "}
              (10%) · Prestador: {money(p.pagamento.valor_prestador_centavos)}
            </p>
            <p>Nenhum dinheiro real foi movimentado.</p>
          </div>
        )}
        <Notice error={failure} />
        {!customer && p.status === "SOLICITADO" && (
          <form
            className="workspace-form"
            onSubmit={(e) => {
              e.preventDefault();
              action("ORCAR");
            }}
          >
            <label>
              Valor total do orçamento (R$)
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                inputMode="decimal"
                placeholder={(p.valor_centavos / 100).toFixed(2)}
              />
            </label>
            <button className="button button-primary" disabled={busy}>
              Enviar orçamento
            </button>
          </form>
        )}
        {customer && p.status === "ORCADO" && (
          <button
            className="button button-primary"
            disabled={busy}
            onClick={() => action("ACEITAR")}
          >
            Aceitar orçamento de {money(p.valor_centavos)}
          </button>
        )}
        {customer && p.status === "ACEITO" && (
          <>
            <p>
              Simule o pagamento para iniciar o trabalho. Não informe dados de
              cartão ou de conta bancária.
            </p>
            <button
              className="button button-primary"
              disabled={busy}
              onClick={() => action("PAGAR")}
            >
              Simular pagamento de {money(p.valor_centavos)}
            </button>
          </>
        )}
        {!customer && p.status === "PAGO_RETIDO" && (
          <form
            className="workspace-form"
            onSubmit={(e) => {
              e.preventDefault();
              action("ENTREGAR");
            }}
          >
            <label>
              Descreva a entrega (pode incluir um link)
              <textarea
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                required
                maxLength={4000}
              />
            </label>
            <button className="button button-primary" disabled={busy}>
              Registrar entrega
            </button>
          </form>
        )}
        {customer && p.status === "ENTREGUE" && (
          <button
            className="button button-primary"
            disabled={busy}
            onClick={() => setConfirm("APROVAR")}
          >
            Aprovar entrega
          </button>
        )}
        {["SOLICITADO", "ORCADO", "ACEITO"].includes(p.status) && (
          <div className="workspace-actions">
            <button
              className="button button-secondary"
              disabled={busy}
              onClick={() => setConfirm("CANCELAR")}
            >
              Cancelar pedido
            </button>
          </div>
        )}
        {confirm && (
          <div className="workspace-error" role="alert">
            <p>
              {confirm === "APROVAR"
                ? "Confirmar a aprovação e liberar o pagamento simulado? Esta etapa conclui o pedido."
                : "Confirmar o cancelamento deste pedido?"}{" "}
            </p>
            <div className="workspace-actions">
              <button
                className="button button-primary"
                disabled={busy}
                onClick={() => action(confirm)}
              >
                Confirmar
              </button>
              <button
                className="button button-secondary"
                disabled={busy}
                onClick={() => setConfirm(null)}
              >
                Voltar
              </button>
            </div>
          </div>
        )}
        {p.avaliacao ? (
          <>
            <h2>Avaliação da entrega</h2>
            <p>{p.avaliacao.nota}/5 estrelas</p>
            <p className="workspace-detail">{p.avaliacao.comentario}</p>
          </>
        ) : (
          customer &&
          p.status === "CONCLUIDO" && (
            <form className="workspace-form" onSubmit={review}>
              <h2>Como foi trabalhar junto?</h2>
              <label>
                Nota
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} estrelas
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Comentário
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={2000}
                />
              </label>
              <button disabled={busy} className="button button-primary">
                Publicar avaliação
              </button>
            </form>
          )
        )}
        <div className="workspace-actions">
          <button
            className="button button-secondary"
            onClick={reload}
            disabled={busy}
          >
            Atualizar pedido
          </button>
        </div>
      </section>
      <Chat id={id} />
    </>
  );
}
export default function OrderDetailPage({ id }) {
  usePageTitle("Pedido");
  return (
    <AppLayout>
      <Private>
        <Order id={id} />
      </Private>
    </AppLayout>
  );
}
