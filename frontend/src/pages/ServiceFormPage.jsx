import { useEffect, useState } from "react";
import AppLayout, { Private, Notice } from "../components/AppLayout.jsx";
import useApi from "../hooks/useApi.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { api, cents } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";

function Form({ id }) {
  const { user } = useAuth();
  const catalog = useApi("/catalogo");
  const account = useApi("/auth/me", true);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria_id: "",
    tipo_servico_id: "",
    preco: "",
    prazo_dias: "7",
    ativo: true,
  });
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return;
    let active = true;
    api("/me/servicos", { protected: true })
      .then((items) => {
        if (!active) return;
        const s = items.find(
          (item) => item.id === id && item.prestador_uid === user.uid,
        );
        if (!s) {
          setBlocked(true);
          throw new Error("Serviço não encontrado na sua conta.");
        }
        setForm({
          titulo: s.titulo,
          descricao: s.descricao,
          categoria_id: s.categoria_id,
          tipo_servico_id: s.tipo_servico_id,
          preco: (s.preco_centavos / 100).toFixed(2),
          prazo_dias: String(s.prazo_dias),
          ativo: s.ativo,
        });
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setBlocked(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, user.uid]);
  function field(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { preco, ...data } = form;
      await api(id ? `/servicos/${id}` : "/servicos", {
        method: id ? "PUT" : "POST",
        protected: true,
        body: {
          ...data,
          preco_centavos: cents(preco),
          prazo_dias: Number(data.prazo_dias),
        },
      });
      location.href = "/meus-servicos";
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading || catalog.loading || account.loading)
    return <p role="status">Carregando…</p>;
  if (catalog.error || account.error || blocked)
    return <Notice error={catalog.error || account.error || error} />;
  if (!account.data.perfil)
    return (
      <section className="workspace-panel">
        <h1>Primeiro, apresenta teu talento.</h1>
        <p>Preencha o perfil para publicar um serviço.</p>
        <a href="/perfil" className="button button-primary">
          Completar perfil
        </a>
      </section>
    );
  return (
    <>
      <h1>{id ? "Editar serviço." : "O que você faz de bom?"}</h1>
      <p className="workspace-muted">
        Um anúncio claro ajuda a encontrar o próximo projeto.
      </p>
      <section className="workspace-panel">
        <form className="workspace-form" onSubmit={save}>
          <label>
            Título
            <input
              name="titulo"
              value={form.titulo}
              onChange={field}
              required
              minLength={5}
              maxLength={120}
              placeholder="Crio a identidade visual da tua marca"
            />
          </label>
          <label>
            Descrição
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={field}
              required
              minLength={20}
              maxLength={5000}
              placeholder="Conte o que está incluído e como você trabalha."
            />
          </label>
          <div className="workspace-row">
            <label>
              Categoria
              <select
                value={form.categoria_id}
                required
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoria_id: e.target.value,
                    tipo_servico_id: "",
                  })
                }
              >
                <option value="">Selecione</option>
                {catalog.data.categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo de serviço
              <select
                name="tipo_servico_id"
                required
                value={form.tipo_servico_id}
                onChange={field}
              >
                <option value="">Selecione</option>
                {catalog.data.tipos_servico
                  .filter((t) => t.categoria_id === form.categoria_id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} (
                      {t.unidade === "HORA" ? "por hora" : "por serviço"})
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="workspace-row">
            <label>
              Preço anunciado (R$)
              <input
                name="preco"
                value={form.preco}
                onChange={field}
                required
                inputMode="decimal"
                placeholder="120,00"
              />
            </label>
            <label>
              Prazo em dias
              <input
                name="prazo_dias"
                type="number"
                min="1"
                max="365"
                required
                value={form.prazo_dias}
                onChange={field}
              />
            </label>
          </div>
          {id && (
            <label className="workspace-check">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Anúncio ativo no feed
            </label>
          )}
          <Notice error={error} />
          <button className="button button-primary" disabled={busy}>
            {id ? "Salvar alterações" : "Publicar serviço"}
          </button>
          <a href="/meus-servicos">Voltar aos meus serviços</a>
        </form>
      </section>
    </>
  );
}
export default function ServiceFormPage({ id }) {
  usePageTitle("Anunciar serviço");
  return (
    <AppLayout>
      <Private>
        <Form id={id} />
      </Private>
    </AppLayout>
  );
}
