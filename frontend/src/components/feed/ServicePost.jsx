import { useState } from 'react';
import Icon from '../Icon.jsx';
import ServiceArtwork from './ServiceArtwork.jsx';
import { formatPrice } from '../../data/feed.js';

export default function ServicePost({ post, liked, saved, onLike, onSave, onDetails, onAuthor }) {
  const [expanded, setExpanded] = useState(false);
  const description = expanded ? post.description : `${post.description.slice(0, 115)}${post.description.length > 115 ? '…' : ''}`;
  return <article className="service-post" aria-labelledby={`post-title-${post.id}`}>
    <header className="post-header"><button type="button" className="post-author" onClick={() => onAuthor(post.authorId)} aria-label={`Ver freelas de ${post.name}`}><img src={post.avatar} alt="" width="42" height="42" /><span><strong>{post.name}<Icon name="badge" /></strong><span>{post.course}</span></span></button><span className="post-time">{post.time}</span></header>
    <ServiceArtwork type={post.art} />
    <div className="post-body"><div className="post-social-actions"><div><button type="button" className={`icon-button${liked ? ' is-liked' : ''}`} onClick={() => onLike(post.id)} aria-pressed={liked} aria-label={`${liked ? 'Descurtir' : 'Curtir'} ${post.title}`}><Icon name="heart" /></button><button type="button" className="icon-button" onClick={() => onDetails(post)} aria-label={`Ver detalhes de ${post.title}`}><Icon name="message" /></button><span className="post-like-count">{post.likes + (liked ? 1 : 0)} curtidas</span></div><button type="button" className={`icon-button${saved ? ' is-saved' : ''}`} onClick={() => onSave(post.id)} aria-pressed={saved} aria-label={`${saved ? 'Remover dos salvos' : 'Salvar'}: ${post.title}`}><Icon name="bookmark" /></button></div>
      <div className="post-category-line"><span className="post-category">{post.categoryLabel}</span><span className="post-rating"><Icon name="star" />{post.rating}<span>({post.reviews})</span></span></div>
      <h2 id={`post-title-${post.id}`}>{post.title}</h2>
      <p className="post-description">{description}{post.description.length > 115 && <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? 'ver menos' : 'ver mais'}</button>}</p>
      <div className="post-tags">{post.tags.map((tag) => <span key={tag}>#{tag.replaceAll(' ', '')}</span>)}</div>
      <div className="post-bottom"><div><span>a partir de</span><strong>{formatPrice(post.price)}<small>{post.unit}</small></strong></div><button type="button" className="button button-primary" onClick={() => onDetails(post)}>Ver serviço<Icon name="arrow" /></button></div>
    </div>
  </article>;
}
