import Icon from '../Icon.jsx';

export const feedNavItems = [
  { id: 'inicio', label: 'Início', icon: 'home' },
  { id: 'explorar', label: 'Explorar', icon: 'compass' },
  { id: 'salvos', label: 'Salvos', icon: 'bookmark' },
  { id: 'pedidos', label: 'Meus pedidos', icon: 'bag' },
  { id: 'mensagens', label: 'Mensagens', icon: 'message' },
];

export default function FeedNav({ active, onChange, savedCount, mobile = false }) {
  return <nav className={mobile ? 'feed-bottom-nav' : 'feed-side-nav'} aria-label={mobile ? 'Navegação móvel do feed' : 'Navegação do feed'}>{feedNavItems.map((item) => <button key={item.id} type="button" className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'page' : undefined} onClick={() => onChange(item.id)}><Icon name={item.icon} /><span>{mobile && item.id === 'pedidos' ? 'Pedidos' : item.label}</span>{!mobile && item.id === 'salvos' && savedCount > 0 && <span className="nav-count">{savedCount}</span>}</button>)}</nav>;
}
