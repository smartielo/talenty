const paths = {
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  check: <><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5c3 0 5.5-1 8-3 2.5 2 5 3 8 3z" /><path d="m9 12 2 2 4-4" /></>,
  badge: <><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.34-4.34" /></>,
  monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  palette: <><path d="M12 22a10 10 0 1 1 10-11 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4A1.75 1.75 0 0 1 12 22Z" /><path d="M7 12h.01M9 7h.01M14 6h.01M18 10h.01" /></>,
  pen: <><path d="M13 21h8M16 3l5 5M3 16 16 3a3.5 3.5 0 0 1 5 5L8 21l-6 1Z" /></>,
  video: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="m16 10 6-4v12l-6-4" /></>,
  graduation: <><path d="m2 9 10-5 10 5-10 5ZM6 11v6c3 3 9 3 12 0v-6M22 9v7" /></>,
  chart: <path d="M3 3v18h18M8 17v-3m5 3V5m5 12V9" />,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
  quote: <><path d="M4 4h6v8c0 5-2 7-6 8v-3c2-1 3-2 3-5H4ZM15 4h6v8c0 5-2 7-6 8v-3c2-1 3-2 3-5h-3Z" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
};

export default function Icon({ name, className = '' }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
