export const categories = [
  { id: 'sites', name: 'Sites', price: 'R$149', icon: 'monitor', keywords: 'site web desenvolvimento portfólio programação' },
  { id: 'design', name: 'Design', price: 'R$79', icon: 'palette', keywords: 'logo identidade visual arte' },
  { id: 'textos', name: 'Textos', price: 'R$49', icon: 'pen', keywords: 'redação revisão tradução tcc' },
  { id: 'video', name: 'Vídeo & Reels', price: 'R$99', icon: 'video', keywords: 'vídeo reels edição social' },
  { id: 'monitorias', name: 'Monitorias', price: 'R$39/h', icon: 'graduation', keywords: 'aula cálculo estudo matemática monitoria' },
  { id: 'dados', name: 'Planilhas & Dados', price: 'R$69', icon: 'chart', keywords: 'excel planilha dados análise' },
];

export function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
