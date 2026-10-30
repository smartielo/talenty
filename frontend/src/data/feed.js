export const posts = [
  {
    id: 'portfolio-ana', authorId: 'ana', name: 'Ana Oliveira', initials: 'AO', avatar: '/images/student-1.jpg',
    course: 'Design · UNISAGRADO', city: 'Bauru, SP', category: 'design', categoryLabel: 'Design',
    title: 'Uma identidade visual com a cara da tua marca.',
    description: 'Do primeiro rascunho ao logo que faz sentido. Crio identidade visual para pequenos negócios que querem começar com personalidade. Bora tirar tua ideia do papel?',
    price: 179, likes: 42, rating: '4,9', reviews: 12, time: 'há 2 h', delivery: '5 dias úteis',
    tags: ['Identidade visual', 'Logo', 'Branding'], art: 'brand',
  },
  {
    id: 'site-pedro', authorId: 'pedro', name: 'Pedro Santos', initials: 'PS', avatar: '/images/student-2.jpg',
    course: 'Eng. de Computação · UFPE', city: 'Recife, PE', category: 'sites', categoryLabel: 'Sites',
    title: 'Teu portfólio merece sair do PDF.',
    description: 'Um site leve, responsivo e do teu jeito. Ideal para mostrar teus projetos, divulgar teu negócio ou dar aquele próximo passo na carreira.',
    price: 249, likes: 68, rating: '5,0', reviews: 8, time: 'há 4 h', delivery: '7 dias úteis',
    tags: ['Portfólio', 'React', 'Landing page'], art: 'website',
  },
  {
    id: 'calculo-lucas', authorId: 'lucas', name: 'Lucas Ferreira', initials: 'LF', avatar: '/images/lucas.jpg',
    course: 'Matemática · USP', city: 'São Carlos, SP', category: 'monitorias', categoryLabel: 'Monitorias',
    title: 'Cálculo não precisa ser um bicho de sete cabeças.',
    description: 'Limites, derivadas e integrais com calma, exemplos e zero julgamento. Monitoria online para você entender de verdade e chegar mais tranquilo na prova.',
    price: 39, unit: '/h', likes: 31, rating: '4,9', reviews: 21, time: 'há 6 h', delivery: 'Horário a combinar',
    tags: ['Cálculo I', 'Aula online', 'Exatas'], art: 'math',
  },
  {
    id: 'revisao-beatriz', authorId: 'beatriz', name: 'Beatriz Martins', initials: 'BM', avatar: '/images/beatriz.jpg',
    course: 'Letras · Mackenzie', city: 'São Paulo, SP', category: 'textos', categoryLabel: 'Textos',
    title: 'Tua ideia, com as palavras certas.',
    description: 'Revisão de textos, trabalhos acadêmicos e formatação ABNT. Cuido da clareza e dos detalhes para o teu texto comunicar o que você quer dizer.',
    price: 49, likes: 23, rating: '4,8', reviews: 9, time: 'há 8 h', delivery: '3 dias úteis',
    tags: ['Revisão', 'ABNT', 'Texto acadêmico'], art: 'text',
  },
  {
    id: 'reels-marina', authorId: 'marina', name: 'Marina Costa', initials: 'MC', avatar: '/images/student-3.jpg',
    course: 'Publicidade · UNESP', city: 'Bauru, SP', category: 'video', categoryLabel: 'Vídeo & Reels',
    title: 'Reels que contam uma boa história.',
    description: 'Transformo teus vídeos em conteúdo com ritmo, legenda e personalidade. Edição de vídeos curtos para quem quer aparecer nas redes do seu jeito.',
    price: 99, likes: 57, rating: '5,0', reviews: 6, time: 'ontem', delivery: '4 dias úteis',
    tags: ['Edição', 'Reels', 'Redes sociais'], art: 'video',
  },
  {
    id: 'planilhas-pedro', authorId: 'pedro', name: 'Pedro Santos', initials: 'PS', avatar: '/images/student-2.jpg',
    course: 'Eng. de Computação · UFPE', city: 'Recife, PE', category: 'dados', categoryLabel: 'Planilhas & Dados',
    title: 'Menos planilha bagunçada. Mais tempo pra você.',
    description: 'Organizo teus dados e crio planilhas com fórmulas, gráficos e automações simples. Controle financeiro, estudos ou aquele projeto que precisa de uma mão.',
    price: 69, likes: 18, rating: '5,0', reviews: 8, time: 'ontem', delivery: '3 dias úteis',
    tags: ['Excel', 'Dashboard', 'Organização'], art: 'data',
  },
];

export const creators = posts.filter((post, index, all) => all.findIndex((item) => item.authorId === post.authorId) === index);
export const formatPrice = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
