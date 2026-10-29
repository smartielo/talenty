# Interface Talenty

Página inicial do design fornecido, implementada em React + Vite e CSS, sem biblioteca de componentes ou scripts de exportação. Não depende de Firebase para abrir.

## Execução local

Instale Node.js 22.12+ e execute:

```powershell
cd frontend
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente http://127.0.0.1:5173). Para gerar a versão de produção: `npm run build`. Para conferir o resultado: `npm run preview`.

Neste ambiente, um Node portátil foi baixado para `.tools/` (ignorado pelo Git). Sem instalar o Node no sistema, também é possível iniciar a partir da raiz do repositório:

```powershell
$env:Path = "$PWD\.tools\node-v22.16.0-win-x64;$env:Path"
cd frontend
npm run dev
```

Validação realizada: build de produção, layouts em 1440, 1024, 768, 390 e 320 px no Chrome, menu móvel, filtro de monitorias, abertura de diálogo, fechamento por Escape e carregamento das imagens. A busca também foi conferida com termos sem acento e sem resultados.

## Organização

- `src/App.jsx`: composição da página e mensagens sobre funcionalidades futuras.
- `src/components/`: cabeçalho, categorias, ícones SVG, modal acessível e rodapé.
- `src/data/categories.js`: categorias, referências de preço e normalização da busca.
- `src/styles.css`: estilos, cores do design e adaptações para celular e tablet.
- `public/images/`: imagens do design armazenadas localmente.

A busca filtra categorias por nome e palavras-chave, ignorando acentos. O menu móvel, os links internos e os diálogos funcionam com teclado. Os diálogos usam o elemento nativo `dialog`, com foco gerenciado pelo navegador e fechamento por Escape. A fonte DM Sans vem do Google Fonts; há fallback para sans-serif.

Os perfis, depoimentos e números são ilustrativos. Cadastro/login, anúncios, newsletter, pedidos e pagamentos dependem das próximas etapas do projeto e não enviam ou persistem dados nesta interface. As ações correspondentes informam esse estado. Pagamentos serão simulados, conforme o README principal. O CNPJ fictício do export foi removido.

As imagens são as referências fornecidas no export do design, copiadas para arquivos locais. Confirmar direitos de uso antes de qualquer publicação fora da apresentação acadêmica.
