import { useEffect, useState } from "react";
import AppLayout, { Private, Notice } from "../components/AppLayout.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import useApi from "../hooks/useApi.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { api } from "../services/api.js";

function ProfileForm() {
  const account = useApi("/auth/me", true);
  const catalog = useApi("/catalogo");
  const [form, setForm] = useState({
    nome_publico: "",
    instituicao_id: "",
    curso: "",
    cidade: "",
    estado: "",
    bio: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (account.data) {
      const profile = account.data.perfil;
      setForm((old) =>
        Object.fromEntries(
          Object.keys(old).map((k) => [
            k,
            profile?.[k] ||
              (k === "nome_publico" ? account.data.usuario.nome : ""),
          ]),
        ),
      );
    }
  }, [account.data]);
  function field(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/me/perfil", { method: "PUT", body: form, protected: true });
      setMessage("Perfil salvo! Você já pode publicar seus serviços.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (account.loading || catalog.loading)
    return <p role="status">Carregando perfil…</p>;
  if (account.error || catalog.error)
    return (
      <>
        <Notice error={account.error || catalog.error} />
        <button
          className="button"
          onClick={() => {
            account.reload();
            catalog.reload();
          }}
        >
          Tentar novamente
        </button>
      </>
    );
  return (
    <>
      <h1>Teu perfil, tua história.</h1>
      <p className="workspace-muted">
        Estas informações aparecem para a comunidade. Seu e-mail continua
        privado.
      </p>
      <section className="workspace-panel">
        <p>
          <span className="workspace-badge">
            {account.data.perfil?.verificado
              ? "Estudante verificado ✓"
              : "Vínculo estudantil não verificado"}
          </span>
        </p>
        <form onSubmit={save} className="workspace-form">
          <label>
            Nome público
            <input
              name="nome_publico"
              value={form.nome_publico}
              onChange={field}
              required
              minLength={2}
              maxLength={80}
            />
          </label>
          <label>
            Instituição
            <select
              name="instituicao_id"
              value={form.instituicao_id}
              onChange={field}
              required
            >
              <option value="">Selecione</option>
              {catalog.data.instituicoes.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Curso
            <input
              name="curso"
              value={form.curso}
              onChange={field}
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <div className="workspace-row">
            <label>
              Cidade
              <input
                name="cidade"
                value={form.cidade}
                onChange={field}
                required
                minLength={2}
                maxLength={100}
              />
            </label>
            <label>
              UF
              <input
                name="estado"
                value={form.estado}
                onChange={(e) =>
                  setForm({ ...form, estado: e.target.value.toUpperCase() })
                }
                required
                pattern="[A-Z]{2}"
                maxLength={2}
                placeholder="SP"
              />
            </label>
          </div>
          <label>
            Sobre você
            <textarea
              name="bio"
              value={form.bio}
              onChange={field}
              maxLength={2000}
            />
          </label>
          <p className="workspace-muted">
            Alterar a instituição ou o curso exige uma nova verificação pela
            administração.
          </p>
          <Notice error={error} message={message} />
          <button className="button button-primary" disabled={busy}>
            Salvar perfil
          </button>
        </form>
      </section>
      <a href="/meus-servicos">Gerenciar meus serviços →</a>
    </>
  );
}

function PublicProfile({ uid }) {
  const profile = useApi(`/prestadores/${uid}`);
  const services = useApi(`/prestadores/${uid}/servicos`);
  const reviews = useApi(`/prestadores/${uid}/avaliacoes`);
  return (
    <>
      <Notice error={profile.error || services.error} />
      {(profile.loading || services.loading) && (
        <p role="status">Carregando…</p>
      )}
      {profile.data && (
        <section className="workspace-panel">
          <span className="workspace-badge">
            {profile.data.verificado
              ? "Estudante verificado ✓"
              : "Perfil da comunidade"}
          </span>
          <h1>{profile.data.nome_publico}</h1>
          <p>
            {profile.data.curso} · {profile.data.cidade}/{profile.data.estado}
          </p>
          <p className="workspace-detail">{profile.data.bio}</p>
        </section>
      )}
      <h2>Serviços publicados</h2>
      {services.data?.map((s) => (
        <ServiceCard key={s.id} service={s} />
      ))}
      {services.data?.length === 0 && <p>Nenhum serviço publicado ainda.</p>}
      <h2>Avaliações recentes</h2>
      <Notice error={reviews.error} />
      {reviews.loading && <p role="status">Carregando avaliações…</p>}
      {reviews.data?.map((r) => (
        <article className="workspace-panel" key={r.id}>
          <strong>{r.nota}/5 estrelas</strong>
          <p className="workspace-detail">
            {r.comentario || "Sem comentário."}
          </p>
        </article>
      ))}
      {reviews.data?.length === 0 && (
        <p className="workspace-muted">
          Este prestador ainda não recebeu avaliações.
        </p>
      )}
    </>
  );
}

export default function ProfilePage({ uid }) {
  usePageTitle("Perfil");
  return (
    <AppLayout>
      {uid ? (
        <PublicProfile uid={uid} />
      ) : (
        <Private>
          <ProfileForm />
        </Private>
      )}
    </AppLayout>
  );
}
