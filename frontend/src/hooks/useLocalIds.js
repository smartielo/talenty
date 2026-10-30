import { useState } from 'react';

// Apenas preferências do catálogo de demonstração; não armazena credenciais.
export default function useLocalIds(key, allowedIds) {
  const [ids, setIds] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? [...new Set(parsed.filter((id) => allowedIds.includes(id)))] : [];
    } catch { return []; }
  });
  function toggle(id) {
    setIds((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Navegação funciona mesmo sem armazenamento. */ }
      return next;
    });
  }
  return [ids, toggle];
}
