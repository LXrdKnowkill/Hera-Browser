# Changelog - Hera Browser

## [2.0.1] - 2025-11-03

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

### 📝 Documentation
- Documentação completa das novas páginas
- Guia de testes manuais
- Resumo de validação de tipos
- Documentação de limpeza de código

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

