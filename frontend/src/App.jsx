import { useState } from 'react';
import Header from './components/Header.jsx';
import CategorySection from './components/CategorySection.jsx';
import Footer from './components/Footer.jsx';
import Icon from './components/Icon.jsx';
import InfoDialog from './components/InfoDialog.jsx';

const info = {
  login: { title: 'Seu próximo freela começa aqui.', text: 'O login com Firebase Authentication será integrado na próxima etapa do projeto. Por enquanto, explore as categorias e conheça a Talenty.' },
  sell: { title: 'Transforma teu talento em freela.', text: 'O cadastro de prestadores ainda está em desenvolvimento. Você poderá criar seu perfil, informar sua faculdade e publicar seus serviços após a integração com a API.' },
  payment: { title: 'Você aprova. A grana é liberada.', text: 'O fluxo planejado mantém o valor retido até a aprovação da entrega. Neste projeto acadêmico, todos os pagamentos serão simulados, sem cobrança ou movimentação financeira real. As regras de cancelamento e reembolso ainda serão implementadas.' },
  verification: { title: 'Uma comunidade de universitários.', text: 'O selo de estudante verificado será concedido por um administrador após conferir os dados do perfil. As pessoas, avaliações e números desta página são exemplos ilustrativos do design.' },
  pricing: { title: 'Preços para começar a conversa.', text: 'Os preços das categorias são referências ilustrativas. A comissão prevista no projeto é de 10% a 15% por serviço; os valores finais serão apresentados antes da confirmação de cada pedido simulado.' },
  help: { title: 'Precisa de uma mão?', text: 'Veja a seção “Como funciona” para conhecer o fluxo da plataforma. A central de ajuda será disponibilizada junto com os recursos de pedidos e contas.' },
  contact: { title: 'Feito por estudantes.', text: 'A Talenty é um projeto acadêmico de Gabriel Martielo e João Diniz, da UNISAGRADO. O canal de atendimento ainda não está disponível.' },
  terms: { title: 'Transparência desde o começo.', text: 'Esta é uma demonstração acadêmica. Perfis, depoimentos e estatísticas são ilustrativos. Não há pagamentos reais. Os termos de uso e a política de privacidade serão definidos antes da disponibilização de contas e serviços.' },
  newsletter: { title: 'Novidades em breve.', text: 'A inscrição em oportunidades ainda não está disponível. Seu e-mail não foi enviado nem armazenado.' },
};

const steps = [
  ['Conta o que você precisa', 'Posta o freela em 2 min ou chama direto quem você curtiu no catálogo.'],
  ['A grana fica guardada', 'Você paga, a Talenty segura o valor. Ninguém sai no prejuízo.'],
  ['Aprovou, liberou 🎉', 'Curtiu a entrega? O pagamento cai para o freela na hora.'],
];

export default function App() {
  const [dialog, setDialog] = useState(null);
  const [search, setSearch] = useState('');
  const showInfo = (key) => setDialog(info[key]);
  function showTutoring() {
    setSearch('Monitorias');
    document.getElementById('categorias').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div id="inicio" className="page-shell">
      <Header onLogin={() => showInfo('login')} onSell={() => showInfo('sell')} onTutoring={showTutoring} />
      <main id="conteudo">
        <section className="container hero" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <div className="hero-badges"><span className="rating-badge">★ 4,9 · 32 mil freelas</span><span className="student-badge">100% universitários</span></div>
            <h1 id="hero-heading">Trampe com quem vive a <span className="highlight">facul</span> como você.</h1>
            <p className="hero-description">Sites, design, textos e aquela monitoria salvadora — feitos por estudantes verificados, com grana protegida até a entrega. Bora?</p>
            <div className="hero-actions"><button type="button" className="button button-primary" onClick={() => showInfo('sell')}>Quero vender meus serviços</button><a className="button button-outline" href="#categorias">Preciso contratar</a></div>
            <div className="social-proof"><div className="avatar-stack" aria-hidden="true"><img src="/images/student-1.jpg" alt="" width="36" height="36" /><img src="/images/student-2.jpg" alt="" width="36" height="36" /><img src="/images/student-3.jpg" alt="" width="36" height="36" /><span>+12k</span></div><p>Jovens de <strong>180 faculdades</strong> já estão aqui</p></div>
          </div>
          <div className="hero-visual"><div className="hero-photo-frame"><img className="hero-photo" src="/images/campus.jpg" alt="Grupo de universitários conversando e sorrindo nos degraus do campus" width="800" height="600" fetchPriority="high" /></div><div className="floating-card payment-card"><p><Icon name="lock" />Pagamento retido</p><strong>R$ 320,00</strong></div><div className="floating-card verified-card"><p><Icon name="badge" />Estudante verificado</p><span>Pedro · Eng. UFPE</span></div></div>
        </section>
        <div className="category-ribbon" aria-label="Serviços na Talenty">{['SITES', 'DESIGN', 'MONITORIAS', 'REELS', 'TCC', 'TRADUÇÃO', 'PITCH DECKS'].map((item) => <span key={item}>{item} <span aria-hidden="true">✦</span></span>)}</div>
        <section id="como-funciona" className="container how-section" aria-labelledby="how-heading"><h2 id="how-heading">Como funciona? <span>Moleza.</span></h2><div className="steps-grid">{steps.map(([title, description], index) => <article key={title} className={`step-card step-${index + 1}`}><span className="step-number">{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
        <CategorySection search={search} onSearchChange={setSearch} onSelect={(category) => setDialog({ title: `${category.name}, do seu jeito.`, text: `Serviços a partir de ${category.price}, como referência do catálogo. Os anúncios e a contratação serão disponibilizados após a integração com a API. Nenhum pedido foi criado.` })} />
        <section id="comunidade" className="container community-section" aria-label="Nossa comunidade e segurança"><figure className="testimonial"><Icon name="quote" className="quote-icon" /><blockquote>“Paguei R$250 no meu portfólio. O valor ficou preso até eu aprovar — me senti MUITO mais segura.”</blockquote><figcaption><img src="/images/beatriz.jpg" alt="" width="44" height="44" loading="lazy" /><div><strong>Beatriz M. · Arq. Mackenzie</strong><span>Contratou site portfólio</span></div><span className="stars" aria-label="5 de 5 estrelas">{Array.from({ length: 5 }, (_, index) => <Icon name="star" key={index} />)}</span></figcaption></figure><div className="community-side"><article id="pagamento-seguro" className="protection-card"><h3><Icon name="check" />Pagamento protegido</h3><p>Se não entregarem como combinado, você recebe 100% de volta. Sem letra miúda.</p><button type="button" className="button button-deep" onClick={() => showInfo('payment')}>Ver como protege</button></article><article className="student-card"><img src="/images/lucas.jpg" alt="Lucas, estudante com seu notebook" width="64" height="64" loading="lazy" /><div><span className="verified-badge"><Icon name="badge" />Estudante verificado</span><h3>Lucas vende monitoria de cálculo</h3><p>R$ 3.200 sacados este semestre</p></div></article></div><p className="demo-note">Demonstração acadêmica: perfis, valores, avaliações e estatísticas ilustrativos. Pagamentos simulados.</p></section>
      </main>
      <Footer onInfo={showInfo} />
    </div>
    <InfoDialog content={dialog} onClose={() => setDialog(null)} />
  </>;
}
