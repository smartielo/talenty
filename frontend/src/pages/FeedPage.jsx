import { useRef, useState } from 'react';
import Brand from '../components/Brand.jsx';
import Icon from '../components/Icon.jsx';
import InfoDialog from '../components/InfoDialog.jsx';
import FeedNav from '../components/feed/FeedNav.jsx';
import ServicePost from '../components/feed/ServicePost.jsx';
import { categories, normalizeSearch } from '../data/categories.js';
import { posts, creators, formatPrice } from '../data/feed.js';
import useLocalIds from '../hooks/useLocalIds.js';
import usePageTitle from '../hooks/usePageTitle.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { logout, authErrorMessage } from '../services/auth.js';
import './Feed.css';

const postIds = posts.map((post) => post.id);
const initialView = new URLSearchParams(window.location.search).get('aba');
const emptyViews = {
  pedidos: { icon: 'bag', title: 'Teus próximos projetos começam aqui.', text: 'Você ainda não tem pedidos por aqui. Explore os serviços e encontre um talento para a tua ideia.', note: 'Pedidos e contratação estarão disponíveis após a integração com a API.' },
  mensagens: { icon: 'message', title: 'Uma boa conversa faz acontecer.', text: 'Nenhuma conversa por enquanto. Quando o chat estiver disponível, suas mensagens com os prestadores vão aparecer aqui.', note: 'O chat dentro dos pedidos ainda está em desenvolvimento.' },
};

export default function FeedPage() {
  const { user, loading, error: authError } = useAuth();
  const [view, setView] = useState(initialView === 'salvos' ? 'salvos' : 'inicio');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('categoria');
    return categories.some((item) => item.id === requested) ? requested : 'todos';
  });
  const [author, setAuthor] = useState(null);
  const [sort, setSort] = useState('recentes');
  const [liked, toggleLike] = useLocalIds('talenty-demo-likes', postIds);
  const [saved, toggleSave] = useLocalIds('talenty-demo-saved', postIds);
  const [dialog, setDialog] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const searchRef = useRef(null);
  usePageTitle(view === 'salvos' ? 'Seus salvos' : 'Seu feed');

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Visitante';
  const initials = user ? displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() : 'V';
  const normalizedQuery = normalizeSearch(query);
  const filtered = posts.filter((post) =>
    (view !== 'salvos' || saved.includes(post.id)) &&
    (category === 'todos' || category === post.category) &&
    (!author || post.authorId === author) &&
    normalizeSearch(`${post.name} ${post.course} ${post.city} ${post.title} ${post.description} ${post.categoryLabel} ${post.tags.join(' ')}`).includes(normalizedQuery),
  ).sort((a, b) => sort === 'preco' ? a.price - b.price : sort === 'populares' ? (b.likes + Number(liked.includes(b.id))) - (a.likes + Number(liked.includes(a.id))) : 0);

  function navigate(nextView) {
    setView(nextView); setQuery(''); setCategory('todos'); setAuthor(null);
    if (nextView === 'explorar') searchRef.current?.focus();
  }
  function selectAuthor(id) { setView('explorar'); setCategory('todos'); setQuery(''); setAuthor(author === id ? null : id); }
  function selectCategory(id) { setCategory(id); setAuthor(null); if (emptyViews[view]) setView('explorar'); }
  function toggleSaved(id) {
    setAnnouncement(saved.includes(id) ? 'Serviço removido dos salvos.' : 'Serviço salvo neste navegador.');
    toggleSave(id);
  }
  function showDetails(post) {
    setDialog({ title: post.title, text: `${post.name} · ${post.course}. ${post.description} A partir de ${formatPrice(post.price)}${post.unit || ''}. Prazo: ${post.delivery}. Este anúncio é ilustrativo; a contratação ainda não está disponível.` });
  }
  function publish() { setDialog({ title: 'Teu talento merece aparecer.', text: user ? 'A publicação de serviços estará disponível após a integração com a API. Você poderá escolher uma categoria, contar o que faz e definir seu preço.' : 'Entre ou crie sua conta para começar. A publicação de serviços será disponibilizada na próxima etapa do projeto.' }); }
  function showAccount() {
    setDialog({ title: `Oi, ${displayName}!`, text: `Conta conectada: ${user.email}. A edição do perfil, os dados da faculdade e a verificação de estudante serão disponibilizados após a integração com a API.`, action: { label: 'Sair da conta', onClick: handleLogout } });
  }
  async function handleLogout() {
    if (signingOut) return;
    setDialog(null);
    setSigningOut(true);
    try { await logout(); window.location.assign('/login'); }
    catch (error) { setDialog({ title: 'Não foi possível sair.', text: authErrorMessage(error) }); setSigningOut(false); }
  }

  const emptyView = emptyViews[view];
  return <div className="feed-page">
    <a href="#feed-content" className="skip-link">Pular para o feed</a>
    <header className="feed-header"><div className="feed-header-inner"><Brand href="/home" /><label className="feed-search"><Icon name="search" /><span className="sr-only">Pesquisar serviços, pessoas ou faculdades</span><input ref={searchRef} type="search" placeholder="Busca um talento, serviço ou faculdade…" value={query} onChange={(event) => { setQuery(event.target.value); if (emptyView) setView('explorar'); }} /></label><div className="feed-header-actions"><button className="icon-button feed-mobile-publish" type="button" aria-label="Anunciar um serviço" onClick={publish}><Icon name="plus" /></button><button className="icon-button" type="button" aria-label="Notificações" onClick={() => setDialog({ title: 'Tudo em dia por aqui.', text: 'Você ainda não tem notificações. Novidades sobre pedidos e mensagens vão aparecer aqui quando esses recursos estiverem disponíveis.' })}><Icon name="bell" /></button>{user ? <button className="feed-user-avatar" type="button" onClick={showAccount} aria-label="Ver minha conta">{initials}</button> : <a className="feed-login-link" href="/login">Entrar<Icon name="arrow" /></a>}</div></div></header>
    <div className="feed-layout">
      <aside className="feed-sidebar"><FeedNav active={view} onChange={navigate} savedCount={saved.length} /><button type="button" className="button button-primary feed-publish" onClick={publish}><Icon name="plus" />Anunciar um serviço</button><div className="sidebar-bottom"><a className="sidebar-about" href="/">Conheça a Talenty<Icon name="arrow" /></a><div className="sidebar-account"><span className="feed-user-avatar">{initials}</span><div><strong>{loading ? 'Carregando…' : displayName}</strong><span>{user ? 'Sua conta Talenty' : 'Explorando a comunidade'}</span></div>{user ? <button className="icon-button" type="button" aria-label="Sair da conta" disabled={signingOut} onClick={handleLogout}><Icon name="logout" /></button> : <a className="icon-button" href="/login" aria-label="Entrar na conta"><Icon name="arrow" /></a>}</div></div></aside>

      <main id="feed-content" className="feed-main">
        <div className="feed-welcome"><div><span className="feed-eyebrow">TUA COMUNIDADE, TEUS TALENTOS</span><h1>{view === 'salvos' ? 'Pra guardar e fazer acontecer.' : view === 'pedidos' ? 'Meus pedidos.' : view === 'mensagens' ? 'Tuas conversas.' : view === 'explorar' ? 'Encontra tua próxima conexão.' : 'Teu próximo freela tá aqui.'}</h1><p>{view === 'salvos' ? 'Os talentos que você curtiu e quer ter por perto.' : 'Gente da facul criando, compartilhando e fazendo acontecer.'}</p></div><span className="feed-welcome-star" aria-hidden="true">✳</span></div>
        <div className="feed-demo-banner"><span><Icon name="compass" /><strong>Feed de demonstração</strong><span>Perfis e serviços ilustrativos.</span></span>{!user && <a href="/cadastro">Criar conta ↗</a>}</div>
        {authError && <p className="feed-inline-notice" role="status">Não foi possível recuperar a sessão. Você pode continuar explorando ou <a href="/login">tentar entrar novamente</a>.</p>}
        {user && new URLSearchParams(window.location.search).get('perfil') === 'pendente' && <p className="feed-inline-notice" role="status">Sua conta foi criada. Não foi possível salvar seu nome agora; você poderá completar o perfil depois.</p>}

        {!emptyView && <>
          <section className="creator-section" aria-labelledby="creators-heading"><div className="feed-section-label"><h2 id="creators-heading">Talentos pra conhecer</h2><button type="button" onClick={() => { setView('explorar'); setAuthor(null); setCategory('todos'); setQuery(''); }}>Ver todos<Icon name="arrow" /></button></div><div className="creator-list">{creators.map((creator) => <button type="button" className={`creator-bubble${author === creator.authorId ? ' selected' : ''}`} key={creator.authorId} aria-pressed={author === creator.authorId} onClick={() => selectAuthor(creator.authorId)}><span><img src={creator.avatar} alt="" width="58" height="58" /></span><strong>{creator.name.split(' ')[0]}</strong><small>{creator.categoryLabel}</small></button>)}</div></section>
          <div className="feed-categories" aria-label="Filtrar por categoria"><button type="button" className={category === 'todos' ? 'active' : ''} onClick={() => selectCategory('todos')} aria-pressed={category === 'todos'}><Icon name="compass" />Pra você</button>{categories.map((item) => <button type="button" key={item.id} className={category === item.id ? 'active' : ''} aria-pressed={category === item.id} onClick={() => selectCategory(item.id)}><Icon name={item.icon} />{item.name}</button>)}</div>
          <div className="feed-results-heading"><div><h2>{view === 'salvos' ? 'Seus serviços salvos' : author ? `Freelas de ${creators.find((creator) => creator.authorId === author)?.name.split(' ')[0]}` : query ? 'Resultados da busca' : 'No teu radar'}</h2><span role="status">{filtered.length} {filtered.length === 1 ? 'serviço disponível' : 'serviços disponíveis'}</span></div><label className="feed-sort"><span className="sr-only">Ordenar serviços</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recentes">Mais recentes</option><option value="populares">Mais curtidos</option><option value="preco">Menor preço</option></select></label></div>
          {author && <button type="button" className="feed-clear-author" onClick={() => setAuthor(null)}>Limpar filtro de pessoa<Icon name="close" /></button>}
          <div className="feed-posts">{filtered.map((post) => <ServicePost key={post.id} post={post} liked={liked.includes(post.id)} saved={saved.includes(post.id)} onLike={toggleLike} onSave={toggleSaved} onDetails={showDetails} onAuthor={selectAuthor} />)}</div>
          {filtered.length === 0 && <section className="feed-empty"><Icon name={view === 'salvos' && saved.length === 0 ? 'bookmark' : 'search'} /><h2>{view === 'salvos' && saved.length === 0 ? 'Guarda teus favoritos por aqui.' : 'Ainda não encontramos essa conexão.'}</h2><p>{view === 'salvos' && saved.length === 0 ? 'Toque no ícone de salvar em um serviço para encontrá-lo aqui depois.' : 'Tente outro termo ou remova os filtros para descobrir mais talentos.'}</p><button className="button button-primary" type="button" onClick={() => navigate('explorar')}>Explorar todos os freelas</button></section>}
          {filtered.length > 0 && <p className="feed-end-note">Você está por dentro de tudo. Novos talentos chegam por aqui. ✦</p>}
        </>}
        {emptyView && <section className="feed-empty feed-empty-feature"><Icon name={emptyView.icon} /><h2>{emptyView.title}</h2><p>{emptyView.text}</p><button type="button" className="button button-primary" onClick={() => navigate('explorar')}>Explorar serviços<Icon name="arrow" /></button><small>{emptyView.note}</small></section>}
      </main>

      <aside className="feed-right-rail" aria-label="Sugestões da comunidade"><section className="feed-promo"><span className="promo-sticker">tira tua ideia do papel ✦</span><h2>Teu talento pode ser o próximo destaque.</h2><p>Compartilha o que você faz e encontra quem precisa de você.</p><button type="button" className="button button-deep" onClick={publish}>Quero anunciar<Icon name="arrow" /></button><span className="promo-decoration" aria-hidden="true">✳</span></section><section className="feed-suggestions"><h2>Gente boa pra conhecer</h2>{creators.slice(0, 3).map((creator) => <button type="button" className="suggested-creator" key={creator.authorId} onClick={() => selectAuthor(creator.authorId)}><img src={creator.avatar} alt="" width="36" height="36" /><span><strong>{creator.name}<Icon name="badge" /></strong><small>{creator.course.split(' · ')[1]}</small></span><Icon name="arrow" /></button>)}</section><section className="feed-safety"><Icon name="check" /><div><h2>Tranquilidade pra criar.</h2><p>Pagamento simulado e protegido até a aprovação da entrega.</p></div></section><footer className="feed-rail-footer"><a href="/#como-funciona">Como funciona</a><a href="/#pagamento-seguro">Segurança</a><a href="/">Sobre a Talenty</a><p>© 2026 Talenty · Feito por estudantes.</p></footer></aside>
    </div>
    <FeedNav mobile active={view} onChange={navigate} savedCount={saved.length} />
    <span className="sr-only" role="status">{announcement}</span>
    <InfoDialog content={dialog} onClose={() => setDialog(null)} />
  </div>;
}
