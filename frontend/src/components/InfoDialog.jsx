import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function InfoDialog({ content, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (content && !dialog.open) dialog.showModal();
    else if (!content && dialog.open) dialog.close();
  }, [content]);

  return <dialog ref={dialogRef} className="info-dialog" onClose={onClose} onClick={(event) => { if (event.target === dialogRef.current) onClose(); }} aria-labelledby="dialog-title" aria-describedby="dialog-description">
    {content && <div className="dialog-content"><button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="Fechar"><Icon name="close" /></button><span className="eyebrow">Talenty · Projeto acadêmico</span><h2 id="dialog-title">{content.title}</h2><p id="dialog-description">{content.text}</p><button className="button button-primary" type="button" onClick={onClose}>Entendi</button></div>}
  </dialog>;
}
