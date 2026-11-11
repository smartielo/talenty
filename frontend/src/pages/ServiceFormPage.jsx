import { useState } from "react";
import AppLayout, { Notice, Private } from "../components/AppLayout.jsx";
import useApi from "../hooks/useApi.js";
import { api, cents } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";

function Form() {
  const catalog = useApi("/catalogo");
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria_id: "",
    tipo_servico_id: "",
    preco: "",
    prazo_dias: "7",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function field(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { preco, ...data } = form;
      await api("/servicos", {
        method: "POST",
        protected: true,
        body: { ...data, preco_centavos: cents(preco), prazo_dias: Number(data.prazo_dias) },
      });
      location.href = "/meus-servicos";
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  if (catalog.loading) return <p role="status">Carregando categorias…</p>;
  if (catalog.error) return <Notice error={catalog.error} />;

  return (
    <>
      <h1>Criar anúncio.</h1>
      <p className="workspace-muted">Descreva o serviço de forma clara e objetiva.</p>
      <section className="workspace-panel">
        <form className="workspace-form" onSubmit={save}>
          <label>
            Título
            <input name="titulo" value={form.titulo} onChange={field} required minLength={5} maxLength={120} />
          </label>
          <label>
            Descrição
            <textarea name="descricao" value={form.descricao} onChange={field} required minLength={20} maxLength={5000} />
          </label>
          <div className="workspace-row">
            <label>
              Categoria
              <select
                value={form.categoria_id}
                required
                onChange={(event) => setForm((current) => ({
                  ...current,
                  categoria_id: event.target.value,
                  tipo_servico_id: "",
                }))}
              >
                <option value="">Selecione</option>
                {catalog.data.categorias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <label>
              Tipo de serviço
              <select name="tipo_servico_id" required value={form.tipo_servico_id} onChange={field}>
                <option value="">Selecione</option>
                {catalog.data.tipos_servico
                  .filter((item) => item.categoria_id === form.categoria_id)
                  .map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
          </div>
          <div className="workspace-row">
            <label>
              Preço (R$)
              <input name="preco" value={form.preco} onChange={field} required inputMode="decimal" placeholder="120,00" />
            </label>
            <label>
              Prazo em dias
              <input name="prazo_dias" type="number" min="1" max="365" required value={form.prazo_dias} onChange={field} />
            </label>
          </div>
          <Notice error={error} />
          <button className="button button-primary" disabled={busy}>{busy ? "Publicando…" : "Publicar anúncio"}</button>
        </form>
      </section>
    </>
  );
}

export default function ServiceFormPage() {
  usePageTitle("Criar anúncio");
  return <AppLayout><Private><Form /></Private></AppLayout>;
}
