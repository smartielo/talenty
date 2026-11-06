import { useState } from "react";
import AppLayout, { Private, Notice } from "../components/AppLayout.jsx";
import useApi from "../hooks/useApi.js";
import { api } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";
function Admin() {
  const { data, error, loading, reload } = useApi("/admin/perfis", true);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  async function verify(profile) {
    setBusy(true);
    setFailure("");
    try {
      await api(`/admin/perfis/${profile.id}`, {
        method: "PATCH",
        protected: true,
        body: { verificado: !profile.verificado },
      });
      reload();
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Verificação de estudantes.</h1>
      <p className="workspace-muted">
        Confira o vínculo estudantil pelos canais da instituição antes de
        verificar o perfil. Até 100 perfis atualizados recentemente.
      </p>
      <Notice error={error || failure} />
      {loading && <p role="status">Carregando…</p>}
      <div className="workspace-list">
        {data?.map((p) => (
          <article className="workspace-panel" key={p.id}>
            <h2>{p.nome_publico}</h2>
            <p>
              {p.instituicao_id} · {p.curso}
            </p>
            <p>
              {p.cidade}/{p.estado}
            </p>
            <span className="workspace-badge">
              {p.verificado ? "Verificado" : "Não verificado"}
            </span>
            <div className="workspace-actions">
              <button
                className="button button-primary"
                disabled={busy}
                onClick={() => verify(p)}
              >
                {p.verificado
                  ? "Remover verificação"
                  : "Confirmar vínculo estudantil"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {data?.length === 0 && <p>Nenhum perfil cadastrado ainda.</p>}
    </>
  );
}
export default function AdminPage() {
  usePageTitle("Administração");
  return (
    <AppLayout>
      <Private>
        <Admin />
      </Private>
    </AppLayout>
  );
}
