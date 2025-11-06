# Changelog - Hera Browser

## [2.0.5.1] - 2025-11-06 (Hotfix)

### 🐛 Critical Bug Fixes

#### Memory Leak - Find in Page Listeners
- **FIXED: Memory leak where `found-in-page` listeners accumulated**
  - Added proper cleanup of WebContents event listeners when closing tabs
  - Stored listener references in `tabInfo` for proper removal
  - Prevents memory growth in long-running sessions with many tabs
  - Improved overall stability when using find in page frequently

#### Race Condition - Find Bar State Restoration
- **FIXED: Find bar state restored in wrong tab when switching quickly**
  - Added 50ms delay before restoring find state after tab switch
  - Added tab ID validation in `find:restore-state` handler
  - Prevents search text from appearing in wrong tab
  - Improved reliability when switching tabs during active search

### 🔧 Technical Improvements
- Added `TabInfoData` interface with `foundInPageListener` property
- Improved `switchToTab()` to stop find in previous tab before switching
- Added tab validation in find input debounce handler
- Added retry mechanism for favorites bar rendering (up to 2 retries)
- Improved error handling in favorites bar operations

### 📊 Performance
- Reduced memory usage when using find in page with many tabs
- Eliminated listener accumulation in long-running sessions
- Improved responsiveness when switching tabs during search

### 🐞 Known Issues
- Downloads show "Cancelado" status even after successful completion (files download correctly)
- Database not initialized in dev mode (`npm start`) - works in production build

---

## [2.0.5] - 2025-11-05

### 🐛 Critical Bug Fixes

#### SQLite3 Loading in Production Build
- **FIXED: Database not working in packaged application**
  - Improved sqlite3 loading with multiple fallback paths
  - Added detailed logging for troubleshooting
  - Fixed path resolution for extraResource location
  - History, bookmarks, and settings now work correctly in production builds

#### Find Bar UI Height Calculation
- **FIXED: Find bar affecting all tabs instead of just active tab**
  - Implemented per-tab find bar visibility state
  - Fixed UI height calculation to use active tab state only
  - Removed visual artifacts when switching between tabs
  - Each tab now maintains independent find bar state

### 🔧 Technical Improvements
- Added `tabFindBarStates` Map for per-tab find bar visibility tracking
- Improved `getUIHeight()` to calculate based on active tab state
- Added proper cleanup of find bar state when closing tabs
- Enhanced sqlite3 module loading with better error messages

---

## [2.0.5] - 2025-11-05

### ✨ New Features

#### Find in Page (Busca na Página)
- ✨ **Ctrl+F** abre barra de busca integrada
- ✨ **Busca em tempo real** enquanto digita (com debounce de 150ms)
- ✨ **Contador de resultados** mostra "X de Y" resultados encontrados
- ✨ **Navegação com botões** anterior/próximo
- ✨ **Enter/Shift+Enter** para navegar entre resultados
- ✨ **Escape ou botão X** fecha a barra
- ✨ **Feedback visual** - borda vermelha quando não há resultados
- ✨ **Isolamento entre abas** - cada aba tem sua própria busca independente
- ✨ **Persistência de estado** - ao trocar de aba e voltar, a busca continua
- ✨ **Visibilidade por aba** - a barra só aparece nas abas onde foi aberta
- ✨ **Busca em páginas internas** (hera://new-tab, hera://settings, etc.)
- ✨ **Caracteres especiais** funcionam corretamente
- ✨ **Navegação circular** - do último resultado volta para o primeiro
- ✨ **Scroll automático** para o resultado visível (nativo do Electron)

### 🚀 Performance Improvements

#### Memory Leak Fixes
- ⚡ **Debounce na busca** - aguarda 150ms após parar de digitar para evitar buscas excessivas
- ⚡ **Cleanup ao fechar aba** - para busca ativa e destroi webContents para liberar memória
- ⚡ **Listeners isolados** - apenas a aba ativa envia resultados para UI
- ⚡ **Remoção de listeners** ao fechar abas para evitar memory leaks

### 🎨 UI/UX Improvements
- ✨ Barra de busca moderna e integrada ao design
- ✨ Animações suaves ao abrir/fechar
- ✨ Ícones SVG para botões de navegação
- ✨ Input com placeholder e auto-focus
- ✨ Contador de resultados sempre visível
- ✨ Botão de fechar com animação de rotação

### 🔧 Technical Details
- ✅ Implementado sistema de estado por aba com `Map<string, TabFindState>`
- ✅ Funções `saveFindState()` e `restoreFindState()` para persistência
- ✅ Handlers IPC: `find:start`, `find:next`, `find:stop`, `find:restore-state`
- ✅ Listener `found-in-page` em cada BrowserView com filtro por aba ativa
- ✅ Cleanup automático ao trocar/fechar abas
- ✅ Debounce implementado para otimizar performance
- ✅ Fixing Error about favorite system.

---


## [2.0.4.1] - 2025-11-04

### 🔧 Hotfix - Empacotamento e Build

#### Correções Críticas
- 🐛 **FIXED: Erro "Cannot find module 'sqlite3'" no build empacotado**
  - Configurado extraResource para copiar sqlite3 completo
  - Ajustado ASAR unpack para módulos nativos (*.node, *.dll)
  - Implementado fallback para carregar sqlite3 do extraResource
  - Desabilitado OnlyLoadAppFromAsar para permitir módulos externos

- 🐛 **FIXED: Páginas internas (hera://) não carregavam quando empacotado**
  - Adicionado copy-webpack-plugin para copiar arquivos HTML/CSS/JS/PNG
  - Ajustado caminho do protocol handler para usar .webpack/main quando empacotado
  - Implementado detecção automática de ambiente (desenvolvimento vs produção)

- 🐛 **FIXED: Favicon das páginas internas não carregava**
  - Adicionado suporte para arquivos de imagem na raiz do protocolo hera://
  - Implementado busca case-insensitive para nomes de arquivo
  - Corrigido carregamento de HeraBrowser256x256.png

#### Melhorias de Build
- ✨ Adicionado copy-webpack-plugin como dependência
- ✨ Logs detalhados no protocol handler para debug
- ✨ Tratamento de erro melhorado para ERR_ABORTED

#### Limpeza de Código
- 🧹 Removidos arquivos .bat de desenvolvimento (force-push, quick-commit, release)
- 🧹 Removidos arquivos .md de documentação temporária
- 📝 Adicionados guias de release (RELEASE_GUIDE.md, GITHUB_RELEASE_NOTES.md)
- 📝 Adicionado script build-and-release.bat

## [2.0.4] - 2025-11-04

### 🎨 UI/UX Polish

#### CSS Refactor & Improvements
- ✨ **Sistema de variáveis CSS** - 30+ variáveis para cores, espaçamentos, bordas e transições
- ✨ **Animações aprimoradas** - Transições mais suaves e elegantes em todos os elementos
- ✨ **Efeitos de hover melhorados** - Gradientes, elevações e feedback visual
- ✨ **Scrollbars customizadas** - Design consistente em todos os painéis
- ✨ **Código limpo** - Removidas duplicações e código obsoleto

#### Melhorias Específicas
- ✨ Abas com gradiente sutil e indicador visual de aba ativa
- ✨ Botão "+" com rotação ao hover
- ✨ Omnibox com animação slide down e badges elegantes
- ✨ Favoritos com elevação e efeito de gradiente
- ✨ Histórico com borda lateral colorida ao hover
- ✨ Downloads com ícones gradientes e barra de progresso animada
- ✨ Notificações toast com animações dramáticas
- ✨ Badge de downloads com animação "pop"

#### New Tab Wallpaper
- ✨ **Suporte a wallpaper customizado** - HeraWallpaper.png como fundo da new-tab
- ✨ **Efeito glassmorphism** - Barra de busca com backdrop-filter blur
- ✨ **Logo otimizada** - Tamanho ajustado para melhor composição visual

### 🐛 Bug Fixes
- 🐛 **FIXED: Downloads não apareciam na página hera://downloads** - Eventos agora são enviados para BrowserViews
- 🐛 **FIXED: Downloads de sites externos não eram capturados** - Listener adicionado para sessão persist:web-content
- 🐛 **FIXED: Badge de downloads não aparecia** - Sistema de notificações corrigido

### 🧹 Code Quality
- ✅ Organização melhorada do CSS (seções bem definidas)
- ✅ Consistência em todos os estilos
- ✅ Performance otimizada (GPU-accelerated animations)
- ✅ Acessibilidade melhorada (contraste e feedback visual)
- ✅ Warnings de TypeScript suprimidos em arquivos de teste

### 📊 Statistics
- 📉 CSS reduzido de ~1200 para ~1100 linhas
- ➕ 15+ animações keyframes otimizadas
- ➕ 30+ variáveis CSS criadas

---

## [2.0.3] - 2025-11-03

### 🐛 Bug Fixes

#### Protocolo hera:// e Sessão Persistente
- ✅ **FIXED: Página inicial não carregava** - Corrigido erro "Obter um aplicativo para abrir este 'hera' link"
- ✅ **FIXED: WhatsApp Web não funcionava** - Implementada sessão persistente correta
- ✅ Navegação interna agora usa API do Electron em vez de window.location
- ✅ User Agent configurado globalmente para todas as sessões
- ✅ Partições separadas para páginas internas e externas
- ✅ Permissões configuradas corretamente (media, notifications, clipboard, etc)

### 🔧 Technical Improvements
- ✅ Melhor tratamento de erros de carregamento
- ✅ Handler de abertura de janelas otimizado
- ✅ Código limpo e organizado

---

## [2.0.2] - 2025-11-03

### ✨ New Features

#### Barra de Favoritos Funcional
- ✅ **Visualização de favoritos** na barra superior
- ✅ Renderização automática dos bookmarks salvos
- ✅ Favicons exibidos nos favoritos
- ✅ Clique para navegar diretamente
- ✅ Atualização em tempo real ao adicionar/remover favoritos
- ✅ Scroll horizontal para muitos favoritos
- ✅ Design moderno com hover effects

### 🎨 UI Improvements
- ✅ Estilos melhorados para itens de favoritos
- ✅ Animações suaves ao passar o mouse
- ✅ Scrollbar customizada
- ✅ Mensagem quando não há favoritos

---

## [2.0.1] - 2025-11-03

### 🔒 CRITICAL SECURITY FIX

#### Preload Compartmentalization
- ✅ **FIXED: Critical vulnerability** - Sites externos não podem mais acessar APIs privilegiadas
- ✅ Criado `preload-ui.ts` (privilegiado) para páginas internas
- ✅ Criado `preload-web.ts` (limitado) para sites externos
- ✅ Sites externos **NÃO** podem mais:
  - Acessar histórico de navegação
  - Limpar dados do navegador
  - Acessar favoritos
  - Modificar configurações
  - Acessar banco de dados
- ✅ Implementado princípio do menor privilégio
- ✅ Compartimentalização de segurança entre código confiável e não-confiável

### ✨ New Features

#### Páginas Dedicadas
- ✅ **Página de Histórico** (`hera://history`)
  - Interface moderna e intuitiva para visualizar histórico
  - Busca em tempo real por título ou URL
  - Agrupamento automático por data (Hoje, Ontem, datas específicas)
  - Remoção de itens individuais
  - Limpeza completa do histórico
  - Navegação ao clicar em qualquer item

- ✅ **Página de Downloads** (`hera://downloads`)
  - Interface dedicada para gerenciar downloads
  - Visualização de progresso em tempo real
  - Ícones dinâmicos por tipo de arquivo (PDF, imagens, arquivos, etc.)
  - **Abrir arquivo baixado** com um clique
  - **Mostrar arquivo na pasta** do sistema
  - Abrir pasta de downloads padrão
  - Persistência de downloads entre sessões
  - Limpeza de downloads concluídos

#### APIs de Download
- ✅ `openDownloadedFile()` - Abre arquivo baixado
- ✅ `showDownloadInFolder()` - Mostra arquivo na pasta do sistema
- ✅ `openDownloadsFolder()` - Abre pasta de downloads padrão

### 🎨 UI/UX Improvements
- Design moderno e consistente com tema escuro
- Animações suaves e transições
- Estados vazios informativos
- Responsivo para diferentes tamanhos de tela
- Favicons nos itens de histórico
- Barra de progresso animada para downloads

### 🔧 Technical Improvements
- **100% TypeScript Type Coverage** - Zero erros de tipo no código fonte
- Código limpo e organizado
- Imports organizados por categoria
- Remoção de código não utilizado
- Documentação completa das APIs

### 🐛 Bug Fixes
- ✅ Menu agora abre corretamente as páginas de histórico e downloads
- ✅ Botões "Histórico" e "Downloads" no menu dos 3 pontinhos funcionando

### 🎨 Download Experience Improvements
- ✅ **Badge de contador** no botão de downloads mostra downloads ativos
- ✅ **Notificações toast** quando download inicia e completa
- ✅ **Animação de pulso** no botão durante downloads
- ✅ **Auto-fechamento** do painel após downloads concluírem
- ✅ **Feedback visual** claro e profissional
- ✅ Botão de downloads abre página dedicada `hera://downloads`

### 📝 Documentation
- Documentação completa das novas páginas
- Guia de testes manuais
- Resumo de validação de tipos
- Documentação de limpeza de código
- Documentação de segurança (SECURITY_PRELOAD.md)

---

## [2.0.0] - 2025

### 🚀 Major Features

#### Sistema de Favoritos Completo
- ✅ Sistema de favoritos (bookmarks) completo com suporte a pastas
- ✅ Busca de favoritos por título ou URL
- ✅ Organização hierárquica com pastas e subpastas
- ✅ Interface para gerenciar favoritos
- ✅ Adicionar/remover favoritos facilmente

#### Omnibox Inteligente
- ✅ Sugestões em tempo real baseadas em histórico
- ✅ Autocomplete de URLs visitadas
- ✅ Integração com favoritos para sugestões rápidas
- ✅ Busca inteligente que detecta URLs vs pesquisas

#### Atalhos de Teclado Avançados
- ✅ Ctrl+1-9: Navegar diretamente para a aba número N
- ✅ Ctrl+Tab / Ctrl+Shift+Tab: Alternar entre abas
- ✅ Ctrl+F: Busca rápida na página
- ✅ Ctrl+D: Adicionar aos favoritos
- ✅ Ctrl+Shift+Delete: Limpar dados de navegação
- ✅ F12: Abrir/fechar DevTools (painel integrado)

#### Otimizações de Performance
- ✅ Lazy loading de abas inativas (suspensão)
- ✅ Cache inteligente de favicons
- ✅ Otimização de memória para múltiplas abas
- ✅ Indices no banco de dados para buscas rápidas

#### Sistema de Permissões
- ✅ Gerenciamento de permissões por site (câmera, microfone, localização)
- ✅ Interface para visualizar e revogar permissões
- ✅ Prompt automático para novas permissões

#### Melhorias de UI/UX
- ✅ Preview de abas ao passar o mouse (thumbnails)
- ✅ Animações suaves em transições
- ✅ Feedback visual melhorado
- ✅ Barra de progresso de carregamento
- ✅ Indicadores de segurança visuais

#### DevTools Avançado
- ✅ Network Monitor integrado
- ✅ Performance profiling
- ✅ Memory profiler
- ✅ Application inspector

#### Busca Rápida na Página
- ✅ Ctrl+F para buscar texto na página atual
- ✅ Highlight de resultados
- ✅ Navegação entre resultados (Enter/Shift+Enter)
- ✅ Contador de resultados

### 📊 Melhorias Técnicas

- ✅ Arquitetura de dados escalável com SQLite
- ✅ Índices otimizados para performance
- ✅ Gestão eficiente de memória
- ✅ Código modular e manutenível
- ✅ Tratamento robusto de erros

### 🔧 Correções

- ✅ Histórico agora salva corretamente todas as páginas
- ✅ Favicons carregam de forma mais confiável
- ✅ URL persiste após recarregar páginas
- ✅ Persistência de abas funcionando perfeitamente

---

## [1.0.6] - Versão Anterior

### Features
- Sistema de histórico com SQLite
- Persistência de abas
- Sistema de configurações
- Favicons funcionais
- DevTools básico (F12)
