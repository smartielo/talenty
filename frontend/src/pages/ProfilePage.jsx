import { useEffect, useState } from "react";
import AppLayout, { Notice, Private } from "../components/AppLayout.jsx";
import useApi from "../hooks/useApi.js";
import { api } from "../services/api.js";
import usePageTitle from "../hooks/usePageTitle.js";

function Profile() {
  // O perfil reúne os dados da conta e indicadores simples para a apresentação
  // (quantidade de anúncios publicados e interesses enviados).
  const profile = useApi("/me/perfil", true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data) setName(profile.data.nome);
  }, [profile.data]);

  async function save(event) {
    // Apenas o nome é editável. UID, e-mail e indicadores são controlados pelo
    // Firebase/backend e nunca são enviados como campos alteráveis.
    event.preventDefault();
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      await api("/me/perfil", {
        method: "PATCH",
        protected: true,
        body: { nome: name },
      });
      setMessage("Perfil atualizado com sucesso.");
      profile.reload();
    } catch (requestError) {
      setFailure(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Meu perfil.</h1>
      <p className="workspace-muted">Gerencie como seu nome aparece nos anúncios e interesses.</p>
      <Notice error={profile.error || failure} message={message} />
      {profile.loading ? <p role="status">Carregando perfil…</p> : null}
      {profile.data ? (
        <>
          <section className="workspace-profile-summary">
            <div className="workspace-profile-avatar">{profile.data.nome[0].toUpperCase()}</div>
            <div>
              <h2>{profile.data.nome}</h2>
              <p className="workspace-muted">{profile.data.email}</p>
            </div>
          </section>
          <div className="workspace-stats">
            <a href="/meus-servicos" className="workspace-stat">
              <strong>{profile.data.quantidade_anuncios}</strong>
              <span>Anúncios publicados</span>
            </a>
            <a href="/meus-interesses" className="workspace-stat">
              <strong>{profile.data.quantidade_interesses}</strong>
              <span>Interesses enviados</span>
            </a>
          </div>
          <section className="workspace-panel">
            <h2>Dados pessoais</h2>
            <form className="workspace-form" onSubmit={save}>
              <label>
                Nome
                <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required />
              </label>
              <label>
                E-mail
                <input value={profile.data.email} readOnly disabled />
              </label>
              <button className="button button-primary" disabled={busy}>
                {busy ? "Salvando…" : "Salvar alterações"}
              </button>
            </form>
          </section>
          <section className="workspace-panel workspace-privacy-note">
            <h2>Privacidade do contato</h2>
            <p>O telefone informado em um anúncio não aparece publicamente. Ele só é enviado a clientes que você aceitar.</p>
          </section>
        </>
      ) : null}
    </>
  );
}

export default function ProfilePage() {
  usePageTitle("Meu perfil");
  return <AppLayout><Private><Profile /></Private></AppLayout>;
}
