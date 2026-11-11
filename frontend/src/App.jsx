import { useState } from "react";
import CategorySection from "./components/CategorySection.jsx";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";

const steps = [
  ["Crie sua conta", "Cadastre nome, e-mail e senha pelo Firebase Authentication."],
  ["Publique um anúncio", "Informe título, descrição, categoria, preço e prazo."],
  ["Encontre talentos", "Use a pesquisa e os filtros para localizar um serviço."],
];

export default function App() {
  const [search, setSearch] = useState("");

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div id="inicio" className="page-shell">
        <Header />
        <main id="conteudo">
          <section className="container hero" aria-labelledby="hero-heading">
            <div className="hero-copy">
              <div className="hero-badges"><span className="student-badge">PROJETO ACADÊMICO</span></div>
              <h1 id="hero-heading">Talentos universitários em um só lugar.</h1>
              <p className="hero-description">
                Uma plataforma simples para anunciar habilidades e encontrar serviços publicados pela comunidade.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="/cadastro">Criar conta</a>
                <a className="button button-outline" href="/home">Ver anúncios</a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-photo-frame">
                <img className="hero-photo" src="/images/campus.jpg" alt="Estudantes reunidos no campus" width="800" height="600" />
              </div>
            </div>
          </section>

          <section id="como-funciona" className="container how-section" aria-labelledby="how-heading">
            <h2 id="how-heading">Como funciona</h2>
            <div className="steps-grid">
              {steps.map(([title, description], index) => (
                <article key={title} className={`step-card step-${index + 1}`}>
                  <span className="step-number">{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <CategorySection
            search={search}
            onSearchChange={setSearch}
            onSelect={(category) => window.location.assign(`/home?categoria=${category.id}`)}
          />
        </main>
        <Footer />
      </div>
    </>
  );
}
