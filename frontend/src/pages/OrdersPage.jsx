import { useEffect, useState } from "react";
import AppLayout, { Private, Notice } from "../components/AppLayout.jsx";
import { api, money } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";
export const statusLabel = {
  SOLICITADO: "Aguardando orçamento",
  ORCADO: "Orçamento enviado",
  ACEITO: "Orçamento aceito",
  PAGO_RETIDO: "Pagamento simulado retido",
  ENTREGUE: "Aguardando aprovação",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};
function Orders({ messages }) {
  const [role, setRole] = useState("cliente");
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setItems([]);
    setNext(null);
    setError("");
    api(`/pedidos?papel=${role}`, { protected: true })
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
  }, [role, version]);
  async function more() {
    setLoading(true);
    setError("");
    try {
      const data = await api(
        `/pedidos?${new URLSearchParams({ papel: role, depois: next })}`,
        { protected: true },
      );
      setItems((old) => [...old, ...data.itens]);
      setNext(data.proximo);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <h1>
        {messages
          ? "Uma boa conversa faz acontecer."
          : "Teus projetos, de perto."}
      </h1>
      <p className="workspace-muted">
        {messages
          ? "Cada pedido tem sua própria conversa. Escolha um para abrir as mensagens."
          : "Acompanhe o orçamento, a entrega e a aprovação."}
      </p>
      <div className="workspace-tabs">
        <button
          className={role === "cliente" ? "selected" : ""}
          onClick={() => setRole("cliente")}
        >
          Contratei
        </button>
        <button
          className={role === "prestador" ? "selected" : ""}
          onClick={() => setRole("prestador")}
        >
          Recebi pedidos
        </button>
        <button onClick={() => setVersion((v) => v + 1)} disabled={loading}>
          Atualizar
        </button>
      </div>
      <Notice error={error} />
      <div className="workspace-list">
        {items.map((p) => (
          <a
            key={p.id}
            className="workspace-panel"
            href={`/pedidos/${p.id}${messages ? "#conversa" : ""}`}
          >
            <span className="workspace-badge">{statusLabel[p.status]}</span>
            <h2>{p.titulo_servico}</h2>
            <p>{money(p.valor_centavos)}</p>
            <span>{messages ? "Abrir conversa →" : "Acompanhar pedido →"}</span>
          </a>
        ))}
      </div>
      {loading && <p role="status">Carregando…</p>}
      {!loading && !error && !items.length && (
        <section className="workspace-panel">
          <h2>Nenhum pedido por aqui ainda.</h2>
          <p>Encontre um talento ou anuncie o seu serviço.</p>
          <a href="/home">Explorar serviços →</a>
        </section>
      )}
      {next && (
        <div className="workspace-actions">
          <button
            className="button button-primary"
            onClick={more}
            disabled={loading}
          >
            Carregar mais
          </button>
        </div>
      )}
    </>
  );
}
export default function OrdersPage({ messages = false }) {
  usePageTitle(`${messages ? "Mensagens" : "Pedidos"}`);
  return (
    <AppLayout>
      <Private>
        <Orders messages={messages} />
      </Private>
    </AppLayout>
  );
}
