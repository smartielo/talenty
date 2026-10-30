import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — Talenty`;
    return () => { document.title = previous; };
  }, [title]);
}
