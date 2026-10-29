import { useState } from 'react';
import Icon from './Icon.jsx';
import { categories, normalizeSearch } from '../data/categories.js';

export default function CategorySection({ search, onSearchChange, onSelect }) {
  const [selected, setSelected] = useState(null);
  const query = normalizeSearch(search);
  const filtered = categories.filter((category) => normalizeSearch(`${category.name} ${category.keywords}`).includes(query));
  return <section id="categorias" className="category-section" aria-labelledby="category-heading"><div className="container section-padding">
    <div className="section-heading"><h2 id="category-heading">Escolhe sua vibe 👇</h2><label className="search-box"><span className="sr-only">Buscar serviço</span><input type="search" placeholder="Buscar serviço..." value={search} onChange={(event) => onSearchChange(event.target.value)} /><Icon name="search" /></label></div>
    <div className="category-grid">{filtered.map((category) => <button key={category.id} type="button" className={`category-card category-${category.id}`} onClick={() => { setSelected(category.id); onSelect(category); }} aria-label={`Ver serviços de ${category.name}, a partir de ${category.price}`}><span className="category-icon"><Icon name={category.icon} /></span><span className="category-name">{category.name}</span><span className="category-price">a partir de {category.price}</span></button>)}</div>
    <p className="sr-only" role="status">{filtered.length} categorias encontradas.{selected && ` Última categoria selecionada: ${categories.find((category) => category.id === selected).name}.`}</p>
    {filtered.length === 0 && <div className="empty-search"><p>Nenhuma categoria encontrada para “{search}”.</p><button className="text-link" type="button" onClick={() => onSearchChange('')}>Ver todas as categorias</button></div>}
  </div></section>;
}
