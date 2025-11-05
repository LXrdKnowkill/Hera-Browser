import './index.css';

// ========================================
// IMPORTS DE TIPOS
// ========================================
import type {
  HeraAPI,
  Bookmark,
  HistoryEntry,
  TabInfo,
  TabUpdateInfo
} from './types';

// Import validation functions (not type-only)
import {
  validateBookmarks,
  validateHistoryEntries
} from './types';

// ========================================
// DECLARAÇÃO GLOBAL DA API
// ========================================
declare global {
  interface Window {
    heraAPI: HeraAPI;
  }
}

// ========================================
// O "CÉREBRO" (AGORA DENTRO DO LISTENER)
// ========================================
window.addEventListener('DOMContentLoaded', () => {

  // ========================================// ELEMENTOS DA UI// ========================================
  const tabBar = document.getElementById('tab-bar')!;
  const navBar = document.getElementById('nav-bar')!;
  const favoritesBarWrapper = document.getElementById('favorites-bar-wrapper') as HTMLDivElement;
  const favoritesBar = document.getElementById('favorites-bar') as HTMLDivElement;
  const favoritesBarCloseBtn = document.getElementById('favorites-bar-close') as HTMLButtonElement;
  const addTabBtn = document.getElementById('add-tab-btn')!;
  const backBtn = document.getElementById('back-btn') as HTMLButtonElement;
  const forwardBtn = document.getElementById('forward-btn') as HTMLButtonElement;
  const reloadBtn = document.getElementById('reload-btn')!;
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  const bookmarkBtn = document.getElementById('bookmark-btn')!;
  const minBtn = document.getElementById('min-btn')!;
  const maxBtn = document.getElementById('max-btn')!;
  const closeBtn = document.getElementById('close-btn')!;


    // Painel de Downloads


    const downloadsBtn = document.getElementById('downloads-btn')!;


    const downloadsPanel = document.getElementById('downloads-panel')!;


    const downloadsList = document.getElementById('downloads-list')!;


    const closeDownloadsPanelBtn = document.getElementById('close-downloads-panel-btn')!;


  


    // Menu Principal


    const menuBtn = document.getElementById('menu-btn')!;


    menuBtn.addEventListener('click', () => {





      window.heraAPI.toggleMenu();


    });


  


    // Página de Histórico


    const historyPage = document.getElementById('history-page')!;
  const historyList = document.getElementById('history-list')!;
  const closeHistoryPageBtn = document.getElementById('close-history-page-btn')!;
  const clearHistoryBtn = document.getElementById('clear-history-btn')!;

  // Find in Page
  const findBar = document.getElementById('find-bar')!;
  const findInput = document.getElementById('find-input') as HTMLInputElement;
  const findResults = document.getElementById('find-results')!;
  const findPrevBtn = document.getElementById('find-prev')!;
  const findNextBtn = document.getElementById('find-next')!;
  const findCloseBtn = document.getElementById('find-close')!;

  // ========================================// ESTADO DA APLICAÇÃO// ========================================
  let activeTabId: string | null = null;
  const tabsOrder: string[] = [];
  
  // Find in Page state - agora por aba
  interface TabFindState {
    isVisible: boolean;
    text: string;
  }
  const tabFindStates = new Map<string, TabFindState>();

  // ========================================
  // BARRA DE FAVORITOS
  // ========================================
  
  /**
   * Renderiza a barra de favoritos com os bookmarks salvos
   * Nota: Esta função apenas atualiza o conteúdo, não controla visibilidade
   */
  async function renderFavoritesBar() {
    if (!favoritesBar || !favoritesBarWrapper) {
      console.error('[Favorites] Elemento não encontrado');
      return;
    }

    try {
      const bookmarksRaw = await window.heraAPI.getBookmarks();
      const bookmarks = validateBookmarks(bookmarksRaw);
      const validBookmarks = bookmarks.filter(b => b.url);
      
      // Limpa conteúdo
      favoritesBar.innerHTML = '';
      
      console.log(`[Favorites] ${validBookmarks.length} favoritos encontrados`);
      
      if (validBookmarks.length === 0) {
        // Se não há favoritos, apenas limpa o conteúdo
        // Não altera a visibilidade da barra
        return;
      }
      
      // Cria elementos dos favoritos
      const fragment = document.createDocumentFragment();
      
      validBookmarks.forEach((bookmark: Bookmark) => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'favorite-item';
        link.title = bookmark.url;
        
        if (bookmark.favicon) {
          const favicon = document.createElement('img');
          favicon.src = bookmark.favicon;
          favicon.className = 'favorite-favicon';
          favicon.onerror = () => favicon.style.display = 'none';
          link.appendChild(favicon);
        }
        
        const textSpan = document.createElement('span');
        textSpan.textContent = bookmark.title || bookmark.url;
        link.appendChild(textSpan);
        
        // Botão de remover
        const removeBtn = document.createElement('button');
        removeBtn.className = 'favorite-remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remover favorito';
        removeBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            await window.heraAPI.removeBookmark(bookmark.id);
            await renderFavoritesBar();
          } catch (error: unknown) {
            console.error('[Favorites] Erro ao remover:', error);
          }
        });
        link.appendChild(removeBtn);
        
        link.addEventListener('click', (e) => {
          e.preventDefault();
          // Não navega se clicou no botão de remover
          if ((e.target as HTMLElement).classList.contains('favorite-remove-btn')) {
            return;
          }
          window.heraAPI.navigateTo(bookmark.url);
        });
        
        fragment.appendChild(link);
      });
      
      favoritesBar.appendChild(fragment);
      // Não altera a visibilidade aqui - deixa o usuário controlar com Ctrl+B
      
    } catch (error) {
      console.error('[Favorites] Erro:', error);
    }
  }

  // ========================================// FUNÇÕES DE GERENCIAMENTO DE ABAS// ========================================
  const addTabToUI = (id: string, title: string, favicon?: string) => {
    const tabButton = document.createElement('button');
    tabButton.id = `tab-${id}`;
    tabButton.className = 'tab-item';
    tabButton.dataset.tabId = id;

    const faviconImg = document.createElement('img');
    faviconImg.className = 'tab-favicon';
    faviconImg.loading = 'lazy';
    
    // SVG padrão como placeholder (sem ícone, apenas espaço vazio como no Brave)
    const defaultFavicon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"></svg>';
    
    if (favicon) {
      // Se for file://, pode precisar de tratamento especial
      if (favicon.startsWith('file://')) {
        faviconImg.src = favicon;
      } else {
        faviconImg.src = favicon;
      }
      
      faviconImg.onerror = () => {
        // Se falhar ao carregar, tenta usar o favicon padrão do site (apenas para URLs HTTP/HTTPS)
        if (!favicon.startsWith('file://') && !favicon.startsWith('data:')) {
          try {
            const urlObj = new URL(favicon);
            const defaultSiteFavicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
            if (defaultSiteFavicon !== favicon) {
              faviconImg.src = defaultSiteFavicon;
              faviconImg.onerror = () => {
                // Se tudo falhar, deixa sem ícone (SVG vazio)
                faviconImg.src = defaultFavicon;
              };
            } else {
              faviconImg.src = defaultFavicon;
            }
          } catch {
            faviconImg.src = defaultFavicon;
          }
        } else {
          faviconImg.src = defaultFavicon;
        }
      };
    } else {
      // Sem favicon, deixa vazio (sem ícone) como no Brave
      faviconImg.src = defaultFavicon;
    }

    const tabTitle = document.createElement('span');
    tabTitle.className = 'tab-title';
    tabTitle.innerText = title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Fechar aba';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTabById(id);
    });

    tabButton.addEventListener('click', () => window.heraAPI.switchToTab(id));

    tabButton.append(faviconImg, tabTitle, closeBtn);
    tabBar.insertBefore(tabButton, addTabBtn);
    tabsOrder.push(id);
  };

  const setActiveTab = (id: string) => {
    document.querySelectorAll('.tab-item').forEach((tab: Element) => tab.classList.remove('active'));
    const tabElement = document.getElementById(`tab-${id}`);
    if (tabElement) {
      tabElement.classList.add('active');
    }
    activeTabId = id;
    updateNavigationButtons();
  };

  const removeTabFromUI = (id: string) => {
    document.getElementById(`tab-${id}`)?.remove();
    const index = tabsOrder.indexOf(id);
    if (index > -1) {
      tabsOrder.splice(index, 1);
    }
    // Limpa o estado de busca da aba fechada
    tabFindStates.delete(id);
  };

  const updateTabInfo = (id: string, info: TabUpdateInfo) => {
    const tabElement = document.getElementById(`tab-${id}`);
    if (!tabElement) return;

    if (info.title) {
      const titleElement = tabElement.querySelector('.tab-title');
      if (titleElement) titleElement.textContent = info.title;
    }

    if (info.favicon) {
      const faviconImg = tabElement.querySelector('.tab-favicon') as HTMLImageElement;
      if (faviconImg) {
        const oldSrc = faviconImg.src;
        // Sempre atualiza o favicon para garantir que seja exibido
        if (!oldSrc || oldSrc !== info.favicon) {
          faviconImg.src = info.favicon;
          faviconImg.onerror = () => {
            // Tenta favicon.ico padrão do site
            try {
              const currentUrl = info.url || urlInput.value;
              if (currentUrl && !currentUrl.startsWith('hera://')) {
                const urlObj = new URL(currentUrl);
                const defaultFavicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
                if (defaultFavicon !== info.favicon) {
                  faviconImg.src = defaultFavicon;
                  faviconImg.onerror = () => {
                    // Fallback final: SVG transparente
                    faviconImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"></svg>';
                  };
                } else {
                  faviconImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"></svg>';
                }
              } else {
                faviconImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"></svg>';
              }
            } catch {
              faviconImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"></svg>';
            }
          };
        }
      }
    }

    if (id === activeTabId) {
      // Sempre atualiza a URL quando a aba ativa é atualizada
      if (info.url !== undefined) {
        urlInput.value = info.url;
        updateSecureIcon(info.url);
      }
    }

    if (info.loading !== undefined) {
      tabElement.classList.toggle('loading', info.loading);
    }
  };

  const closeTabById = (id: string) => {
    window.heraAPI.closeTab(id);
  };

  // ========================================// NAVEGAÇÃO// ========================================
  const updateNavigationButtons = async () => {
    try {
      const state = await window.heraAPI.getNavigationState();
      backBtn.disabled = !state.canGoBack;
      forwardBtn.disabled = !state.canGoForward;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao obter estado de navegação:', error.message);
      } else {
        console.error('Erro ao obter estado de navegação:', error);
      }
    }
  };

  const updateSecureIcon = (url: string) => {
    const secureIcon = document.getElementById('secure-icon');
    if (!secureIcon) return;
    
    // Para páginas internas (hera://), mostrar o ícone do navegador (como o Brave faz)
    if (url && url.startsWith('hera://')) {
      secureIcon.innerHTML = `<img src="hera://HeraBrowser256x256.png" alt="Hera Browser" style="width: 16px; height: 16px; object-fit: contain;">`;
      secureIcon.style.color = '';
      secureIcon.title = 'Hera Browser';
      return;
    }
    
    if (url && url.startsWith('https://')) {
      secureIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      `;
      secureIcon.style.color = '#4CAF50';
      secureIcon.title = 'Conexão segura';
    } else if (url && url.startsWith('http://')) {
      secureIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `;
      secureIcon.style.color = '#FF9800';
      secureIcon.title = 'Conexão não segura';
    } else {
      secureIcon.innerHTML = '';
      secureIcon.style.color = '';
      secureIcon.title = '';
    }
  };

  // Função para obter URL de busca baseada na configuração
  // ========================================// OMNIBOX INTELIGENTE (v2.0.0)// ========================================
  const omniboxSuggestions: Array<{ type: 'history' | 'bookmark' | 'search'; title: string; url: string; favicon?: string }> = [];
  let selectedSuggestionIndex = -1;

  // Função para buscar sugestões baseadas no texto digitado
  const getOmniboxSuggestions = async (query: string): Promise<Array<{ type: 'history' | 'bookmark' | 'search'; title: string; url: string; favicon?: string }>> => {
    const suggestions: Array<{ type: 'history' | 'bookmark' | 'search'; title: string; url: string; favicon?: string }> = [];
    
    if (!query || query.length < 2) return suggestions;

    try {
      // Buscar no histórico
      const historyRaw = await window.heraAPI.getHistory();
      const history = validateHistoryEntries(historyRaw);
      const historyMatches = history
        .filter((item: HistoryEntry) => 
          item.title.toLowerCase().includes(query.toLowerCase()) || 
          item.url.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
        .map((item: HistoryEntry) => ({
          type: 'history' as const,
          title: item.title,
          url: item.url,
          favicon: undefined
        }));
      
      suggestions.push(...historyMatches);

      // Buscar nos favoritos
      const bookmarksRaw = await window.heraAPI.searchBookmarks(query);
      const bookmarks = validateBookmarks(bookmarksRaw);
      const bookmarkMatches = bookmarks
        .slice(0, 3)
        .map((bookmark: Bookmark) => ({
          type: 'bookmark' as const,
          title: bookmark.title,
          url: bookmark.url || '',
          favicon: bookmark.favicon
        }));
      
      suggestions.push(...bookmarkMatches);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao buscar sugestões:', error.message);
      } else {
        console.error('Erro ao buscar sugestões:', error);
      }
    }

    return suggestions.slice(0, 8); // Máximo 8 sugestões
  };

  const getSearchUrl = async (query: string): Promise<string> => {
    try {
      const searchEngine = await window.heraAPI.getSetting('searchEngine') || 'google';
      
      const searchEngines: Record<string, string> = {
        google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        brave: `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
        duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
      };

      return searchEngines[searchEngine] || searchEngines.google;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao obter mecanismo de busca:', error.message);
      } else {
        console.error('Erro ao obter mecanismo de busca:', error);
      }
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  };

  const handleUrlSubmit = async () => {
    const text = urlInput.value.trim();
    if (!text) return;

    try {
      new URL(text);
      window.heraAPI.navigateTo(text);
    } catch (_: unknown) {
      const isUrlLike = /^(localhost)|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/.test(text);
      if (isUrlLike && !text.startsWith('http')) {
        window.heraAPI.navigateTo('https://' + text);
      } else {
        const searchUrl = await getSearchUrl(text);
        window.heraAPI.navigateTo(searchUrl);
      }
    }
    urlInput.blur();
  };

  // ========================================// PÁGINA DE HISTÓRICO// ========================================
  const showHistoryPage = async () => {
    historyPage.classList.remove('hidden');
    historyList.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Carregando...</div>';

    try {
      const historyRaw = await window.heraAPI.getHistory();
      const history = validateHistoryEntries(historyRaw);
      historyList.innerHTML = '';

      const historyEmpty = document.getElementById('history-empty')!;
      if (!history || history.length === 0) {
        historyList.innerHTML = '';
        historyEmpty.classList.remove('hidden');
        return;
      } else {
        historyEmpty.classList.add('hidden');
      }



      history.forEach((item: HistoryEntry) => {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.title = `${item.url}\n${new Date(item.timestamp).toLocaleString()}`;
        
        // Tentar extrair favicon da URL
        let faviconHtml = '';
        try {
          const urlObj = new URL(item.url);
          const faviconUrl = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
          faviconHtml = `<img src="${faviconUrl}" class="history-item-favicon" alt="" onerror="this.style.display='none'">`;
        } catch {
          faviconHtml = '<div style="width: 16px; height: 16px; background: #555; border-radius: 2px;"></div>';
        }
        
        el.innerHTML = `
          ${faviconHtml}
          <div class="history-item-content">
            <span class="history-item-title">${item.title || 'Sem título'}</span>
            <span class="history-item-url">${item.url}</span>
          </div>
          <span class="history-item-timestamp">${new Date(item.timestamp).toLocaleTimeString()}</span>
        `;
        el.addEventListener('click', () => {
          // Abre em nova aba ao invés de navegar na aba atual
          window.heraAPI.createNewTab(item.url);
          hideHistoryPage();
        });
        historyList.appendChild(el);
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao carregar histórico:', error.message);
      } else {
        console.error('Erro ao carregar histórico:', error);
      }
      historyList.innerHTML = '<div style="text-align: center; padding: 40px; color: #ff6b6b;">Erro ao carregar histórico.</div>';
    }
  };

  const hideHistoryPage = () => {
    historyPage.classList.add('hidden');
  };

  // ========================================
  // FIND IN PAGE FUNCTIONS
  // ========================================
  
  /**
   * Salva o estado de busca da aba atual
   */
  function saveFindState() {
    if (!activeTabId) return;
    
    const isVisible = !findBar.classList.contains('hidden');
    tabFindStates.set(activeTabId, {
      isVisible,
      text: findInput.value.trim()
    });
  }

  /**
   * Restaura o estado de busca da aba atual
   */
  function restoreFindState() {
    if (!activeTabId) return;
    
    const state = tabFindStates.get(activeTabId);
    
    if (state && state.isVisible) {
      // Restaura a barra visível com o texto
      findBar.classList.remove('hidden');
      findInput.value = state.text;
      
      // Reinicia a busca se houver texto
      if (state.text) {
        window.heraAPI.send('find:start', { text: state.text });
      } else {
        findResults.textContent = '0 de 0';
        findInput.classList.remove('no-results');
      }
    } else {
      // Esconde a barra
      findBar.classList.add('hidden');
      findInput.value = '';
      findResults.textContent = '0 de 0';
      findInput.classList.remove('no-results');
    }
  }

  /**
   * Exibe a barra de busca e foca o input
   */
  function showFindBar() {
    findBar.classList.remove('hidden');
    findInput.focus();
    findInput.select();
    saveFindState();
    window.heraAPI.send('find-bar-visibility', true);
  }

  /**
   * Fecha a barra de busca e limpa o estado
   */
  function closeFindBar() {
    findBar.classList.add('hidden');
    window.heraAPI.send('find:stop');
    findInput.value = '';
    findResults.textContent = '0 de 0';
    findInput.classList.remove('no-results');
    saveFindState();
    window.heraAPI.send('find-bar-visibility', false);
  }

  /**
   * Handler para busca em tempo real com debounce
   */
  let findDebounceTimer: NodeJS.Timeout | null = null;
  
  findInput.addEventListener('input', () => {
    const text = findInput.value.trim();
    saveFindState(); // Salva o estado ao digitar
    
    // Cancela busca anterior se ainda não executou
    if (findDebounceTimer) {
      clearTimeout(findDebounceTimer);
    }
    
    if (text.length > 0) {
      // Aguarda 150ms após parar de digitar para buscar
      findDebounceTimer = setTimeout(() => {
        window.heraAPI.send('find:start', { text });
        findDebounceTimer = null;
      }, 150);
    } else {
      window.heraAPI.send('find:stop');
      findResults.textContent = '0 de 0';
      findInput.classList.remove('no-results');
    }
  });

  /**
   * Navegação com botões Anterior/Próximo
   */
  findPrevBtn.addEventListener('click', () => {
    const text = findInput.value.trim();
    if (text) {
      window.heraAPI.send('find:next', { text, forward: false });
    }
  });

  findNextBtn.addEventListener('click', () => {
    const text = findInput.value.trim();
    if (text) {
      window.heraAPI.send('find:next', { text, forward: true });
    }
  });

  /**
   * Navegação com Enter/Shift+Enter no input
   */
  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Impede que o evento chegue ao listener global
      const text = findInput.value.trim();
      if (text) {
        const forward = !e.shiftKey;
        window.heraAPI.send('find:next', { 
          text, 
          forward 
        });
      }
    }
  });

  /**
   * Fechar barra com botão X
   */
  findCloseBtn.addEventListener('click', closeFindBar);

  /**
   * Atualizar contador de resultados
   */
  window.heraAPI.on('find:result', (result: { 
    activeMatchOrdinal: number; 
    matches: number;
    finalUpdate: boolean;
  }) => {
    if (result.matches === 0) {
      findResults.textContent = '0 de 0';
      findInput.classList.add('no-results');
    } else {
      findResults.textContent = `${result.activeMatchOrdinal} de ${result.matches}`;
      findInput.classList.remove('no-results');
    }
  });

  /**
   * Restaurar estado ao trocar de aba
   */
  window.heraAPI.on('find:restore-state', () => {
    restoreFindState();
  });

  // ========================================// ATALHOS DE TECLADO AVANÇADOS (v2.0.0)// ========================================
  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    const shift = e.shiftKey;

    // Atalhos básicos
    if (modifier) {
      switch (e.key.toLowerCase()) {
        case 't': 
          e.preventDefault(); 
          window.heraAPI.createNewTab(); 
          break;
        case 'w': 
          e.preventDefault(); 
          if (activeTabId) closeTabById(activeTabId); 
          break;
        case 'r': 
          e.preventDefault(); 
          window.heraAPI.navigateReload(); 
          break;
        case 'j': 
          e.preventDefault(); 
          downloadsPanel.classList.toggle('hidden'); 
          break;
        case 'h': 
          e.preventDefault();
          historyPage.classList.contains('hidden') ? showHistoryPage() : hideHistoryPage();
          break;
        case 'l': 
          e.preventDefault(); 
          urlInput.focus(); 
          urlInput.select(); 
          break;
        case 'd': 
          e.preventDefault();
          // Adicionar aos favoritos
          if (activeTabId && tabsOrder.includes(activeTabId)) {
            const tabElement = document.getElementById(`tab-${activeTabId}`);
            if (tabElement) {
              const title = tabElement.querySelector('.tab-title')?.textContent || '';
              const faviconImg = tabElement.querySelector('.tab-favicon') as HTMLImageElement;
              const favicon = faviconImg?.src;
              const url = urlInput.value;
              if (url && !url.startsWith('hera://')) {
                window.heraAPI.addBookmark(url, title, favicon).catch((error: unknown) => {
                  if (error instanceof Error) {
                    console.error('Erro ao adicionar favorito:', error.message);
                  } else {
                    console.error('Erro ao adicionar favorito:', error);
                  }
                });
              }
            }
          }
          break;
        case 'f':
          if (!shift) {
            e.preventDefault();
            showFindBar();
          }
          break;
        case 'b':
          e.preventDefault();
          // Mostrar/ocultar barra de favoritos
          favoritesBarWrapper.classList.toggle('hidden');
          const isHidden = favoritesBarWrapper.classList.contains('hidden');
          window.heraAPI.send('favorites-bar-visibility', isHidden);
          break;
        // Ctrl+1-9: Navegar para aba específica
        case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
          e.preventDefault();
          const tabIndex = parseInt(e.key) - 1;
          if (tabIndex < tabsOrder.length) {
            window.heraAPI.switchToTab(tabsOrder[tabIndex]);
          }
          break;
      }
      
      // Ctrl+Tab / Ctrl+Shift+Tab: Alternar abas
      if (e.key === 'Tab' && !e.altKey) {
        e.preventDefault();
        const currentIndex = tabsOrder.indexOf(activeTabId || '');
        if (currentIndex !== -1 && tabsOrder.length > 1) {
          let nextIndex;
          if (shift) {
            // Anterior
            nextIndex = currentIndex === 0 ? tabsOrder.length - 1 : currentIndex - 1;
          } else {
            // Próximo
            nextIndex = currentIndex === tabsOrder.length - 1 ? 0 : currentIndex + 1;
          }
          if (tabsOrder[nextIndex]) {
            window.heraAPI.switchToTab(tabsOrder[nextIndex]);
          }
        }
      }
    }
    
    // F5 ou Ctrl+R: Recarregar
    if (e.key === 'F5' || (modifier && e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      window.heraAPI.navigateReload();
    }
    
    // Escape: Fechar modais/painéis
    if (e.key === 'Escape') {
      // Fecha a barra de busca se estiver visível
      if (!findBar.classList.contains('hidden')) {
        closeFindBar();
      }
      historyPage.classList.add('hidden');
      downloadsPanel.classList.add('hidden');
      urlInput.blur();
    }
  });

  // ========================================// EVENT LISTENERS DA UI (BOTÕES, ETC)// ========================================
  addTabBtn.addEventListener('click', () => window.heraAPI.createNewTab());
  backBtn.addEventListener('click', () => window.heraAPI.navigateBack());
  forwardBtn.addEventListener('click', () => window.heraAPI.navigateForward());
  reloadBtn.addEventListener('click', () => window.heraAPI.navigateReload());
  minBtn.addEventListener('click', () => window.heraAPI.windowMinimize());
  maxBtn.addEventListener('click', () => window.heraAPI.windowMaximize());
  closeBtn.addEventListener('click', () => window.heraAPI.windowClose());
  
  // Botão de fechar barra de favoritos
  favoritesBarCloseBtn.addEventListener('click', () => {
    favoritesBarWrapper.classList.add('hidden');
    window.heraAPI.send('favorites-bar-visibility', true); // true = hidden
  });

  // Omnibox agora é um BrowserView separado - não precisa mais de renderSuggestions aqui

  // Omnibox temporariamente desabilitado
  let suggestionTimeout: NodeJS.Timeout;
  urlInput.addEventListener('input', async (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    clearTimeout(suggestionTimeout);
    // TODO: Re-implementar omnibox
  });

  urlInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUrlSubmit();
      urlInput.blur();
      return;
    }
    
    if (e.key === 'Escape') {
      selectedSuggestionIndex = -1;
      urlInput.blur();
      return;
    }
  });

  // Omnibox desabilitado temporariamente

  urlInput.addEventListener('focus', () => {
    urlInput.select();
  });

  // Click no wrapper da URL bar para focar o input
  const urlBarWrapper = document.getElementById('url-bar-wrapper');
  if (urlBarWrapper) {
    urlBarWrapper.addEventListener('click', (e) => {
      // Só foca se não clicou em um elemento interativo
      if (e.target === urlBarWrapper || (e.target as HTMLElement).classList.contains('secure-icon')) {
        urlInput.focus();
        urlInput.select();
      }
    });
  }

  // Botão de Downloads - Abre página dedicada
  downloadsBtn.addEventListener('click', () => {
    window.heraAPI.createNewTab('hera://downloads');
  });
  
  // Painel de Downloads (mantido para notificações rápidas)
  closeDownloadsPanelBtn.addEventListener('click', () => downloadsPanel.classList.add('hidden'));



  // Página de Histórico
  const historySearchInput = document.getElementById('history-search-input') as HTMLInputElement;
  const historyEmpty = document.getElementById('history-empty')!;
  
  closeHistoryPageBtn.addEventListener('click', hideHistoryPage);
  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      await window.heraAPI.clearHistory();
      await showHistoryPage();
    }
  });
  
  // Busca no histórico
  historySearchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase();
    const items = historyList.querySelectorAll('.history-item');
    let visibleCount = 0;
    
    items.forEach((item: Element) => {
      const title = item.querySelector('.history-item-title')?.textContent?.toLowerCase() || '';
      const url = item.querySelector('.history-item-url')?.textContent?.toLowerCase() || '';
      const matches = title.includes(query) || url.includes(query);
      (item as HTMLElement).style.display = matches ? 'grid' : 'none';
      if (matches) visibleCount++;
    });
    
    if (visibleCount === 0 && query.length > 0) {
      historyEmpty.classList.remove('hidden');
      const p = historyEmpty.querySelector('p');
      if (p) p.textContent = 'Nenhum resultado encontrado';
      const span = historyEmpty.querySelector('span');
      if (span) span.textContent = 'Tente uma busca diferente';
    } else {
      historyEmpty.classList.add('hidden');
    }
  });
  
  // Botão de Favorito (v2.0.0)
  let isBookmarked = false;
  
  const updateBookmarkButton = async () => {
    if (!activeTabId || !urlInput.value || urlInput.value.startsWith('hera://')) {
      bookmarkBtn.classList.remove('active');
      isBookmarked = false;
      return;
    }
    
    try {
      const bookmarksRaw = await window.heraAPI.getBookmarks();
      const bookmarks = validateBookmarks(bookmarksRaw);
      const currentUrl = urlInput.value;
      const bookmark = bookmarks.find((b: Bookmark) => b.url === currentUrl);
      isBookmarked = !!bookmark;
      bookmarkBtn.classList.toggle('active', isBookmarked);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao verificar favorito:', error.message);
      } else {
        console.error('Erro ao verificar favorito:', error);
      }
    }
  };
  
  bookmarkBtn.addEventListener('click', async () => {
    if (!activeTabId || !urlInput.value || urlInput.value.startsWith('hera://')) {
      return;
    }
    
    const tabElement = document.getElementById(`tab-${activeTabId}`);
    if (!tabElement) return;
    
    const title = tabElement.querySelector('.tab-title')?.textContent || urlInput.value;
    const faviconImg = tabElement.querySelector('.tab-favicon') as HTMLImageElement;
    const favicon = faviconImg?.src;
    const url = urlInput.value;
    
    try {
      if (isBookmarked) {
        console.log('[Bookmark] Removendo favorito...');
        const bookmarksRaw = await window.heraAPI.getBookmarks();
        const bookmarks = validateBookmarks(bookmarksRaw);
        const bookmark = bookmarks.find((b: Bookmark) => b.url === url);
        if (bookmark) {
          await window.heraAPI.removeBookmark(bookmark.id);
          isBookmarked = false;
          bookmarkBtn.classList.remove('active');
          console.log('[Bookmark] Favorito removido, atualizando barra...');
          await renderFavoritesBar();
        }
      } else {
        console.log('[Bookmark] Adicionando favorito...');
        await window.heraAPI.addBookmark(url, title, favicon);
        isBookmarked = true;
        bookmarkBtn.classList.add('active');
        console.log('[Bookmark] Favorito adicionado, atualizando barra...');
        await renderFavoritesBar();
        // Mostra a barra de favoritos quando adicionar um favorito
        favoritesBarWrapper.classList.remove('hidden');
        window.heraAPI.send('favorites-bar-visibility', false); // false = visible
      }
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao gerenciar favorito:', error.message);
      } else {
        console.error('Erro ao gerenciar favorito:', error);
      }
      // Atualiza a barra de favoritos mesmo em caso de erro para garantir sincronização
      try {
        await renderFavoritesBar();
      } catch (renderError: unknown) {
        if (renderError instanceof Error) {
          console.error('Erro ao atualizar barra de favoritos:', renderError.message);
        } else {
          console.error('Erro ao atualizar barra de favoritos:', renderError);
        }
      }
    }
  });
  
  // Atualizar botão de favorito quando a aba muda
  window.heraAPI.onTabSwitched(() => {
    updateBookmarkButton();
  });
  
  window.heraAPI.onTabUpdated(() => {
    updateBookmarkButton();
  });

  // ========================================// LISTENERS DO MAIN PROCESS (IPC)// ========================================
  window.heraAPI.onTabCreated((tabInfo) => {
    addTabToUI(tabInfo.id, tabInfo.title, tabInfo.favicon);
    setActiveTab(tabInfo.id);
    urlInput.value = tabInfo.url;
    updateSecureIcon(tabInfo.url);
  });

  window.heraAPI.onTabSwitched((id, url) => {
    setActiveTab(id);
    if (url) {
      urlInput.value = url;
      updateSecureIcon(url);
    }
  });

  window.heraAPI.onTabClosed((id) => removeTabFromUI(id));

  window.heraAPI.onTabUpdated((id, tabInfo) => updateTabInfo(id, tabInfo));

  window.heraAPI.onTabLoading((id, isLoading) => updateTabInfo(id, { loading: isLoading }));

  // Listen for omnibox navigation
  window.heraAPI.on('omnibox:navigate', (url: string) => {
    window.heraAPI.navigateTo(url);
    urlInput.blur();
  });

  const downloadsEmpty = document.getElementById('downloads-empty')!;
  
  // Contador de downloads ativos
  let activeDownloads = 0;
  const downloadsBadge = document.getElementById('downloads-badge')!;
  const downloadsButton = document.getElementById('downloads-btn')!;

  function updateDownloadsBadge() {
    if (activeDownloads > 0) {
      downloadsBadge.textContent = activeDownloads.toString();
      downloadsBadge.classList.remove('hidden');
      downloadsButton.classList.add('downloading');
    } else {
      downloadsBadge.classList.add('hidden');
      downloadsButton.classList.remove('downloading');
    }
  }

  function showDownloadToast(title: string, message: string, success = false) {
    const toast = document.createElement('div');
    toast.className = 'download-toast';
    
    const iconClass = success ? 'success' : '';
    const iconSvg = success 
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    
    toast.innerHTML = `
      <div class="download-toast-icon ${iconClass}">
        ${iconSvg}
      </div>
      <div class="download-toast-content">
        <div class="download-toast-title">${title}</div>
        <div class="download-toast-message">${message}</div>
      </div>
      <button class="download-toast-close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    
    document.body.appendChild(toast);
    
    const closeBtn = toast.querySelector('.download-toast-close');
    closeBtn?.addEventListener('click', () => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    });
    
    // Auto-remove após 5 segundos
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  window.heraAPI.onDownloadStarted((data) => {
    activeDownloads++;
    updateDownloadsBadge();
    
    downloadsPanel.classList.remove('hidden');
    downloadsEmpty.classList.add('hidden');
    const { id, filename, totalBytes } = data;
    
    // Mostrar notificação
    showDownloadToast('Download iniciado', filename);
    const item = document.createElement('div');
    item.className = 'download-item';
    item.id = `download-${id}`;
    const formattedSize = totalBytes > 0 ? `${(totalBytes / 1024 / 1024).toFixed(2)} MB` : '';
    
    // Detectar tipo de arquivo
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
    
    item.innerHTML = `
      <div class="download-item-icon">${fileIcon}</div>
      <div class="download-item-content">
        <div class="download-item-name">${filename}</div>
        <div class="download-item-info">
          <span class="download-item-status downloading">Baixando</span>
          <span>${formattedSize}</span>
        </div>
        <div class="download-item-progress">
          <div class="download-item-progress-bar" style="width: 0%;"></div>
        </div>
      </div>
      <div class="download-item-actions">
        <button class="download-item-btn" title="Cancelar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    downloadsList.prepend(item);
  });

  window.heraAPI.onDownloadProgress((data) => {
    const item = document.getElementById(`download-${data.id}`);
    if (!item) return;
    const progressBar = item.querySelector('.download-item-progress-bar') as HTMLElement;
    const infoDiv = item.querySelector('.download-item-info');
    
    if (progressBar && infoDiv) {
      // Calcular percentual baseado no total
      const statusSpan = infoDiv.querySelector('.download-item-status')?.nextElementSibling;
      const totalText = statusSpan?.textContent || '';
      const totalBytes = parseFloat(totalText.replace(' MB', '')) * 1024 * 1024;
      
      if (totalBytes > 0) {
        const percent = Math.min((data.receivedBytes / totalBytes) * 100, 100);
        progressBar.style.width = `${percent}%`;
        if (statusSpan) {
          statusSpan.textContent = `${(data.receivedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB`;
        }
      }
    }
  });

  window.heraAPI.onDownloadComplete((data) => {
    activeDownloads = Math.max(0, activeDownloads - 1);
    updateDownloadsBadge();
    
    const item = document.getElementById(`download-${data.id}`);
    if (!item) return;
    
    const progressDiv = item.querySelector('.download-item-progress');
    const infoDiv = item.querySelector('.download-item-info');
    const actionsDiv = item.querySelector('.download-item-actions');
    
    if (progressDiv && infoDiv && actionsDiv) {
      // Remove barra de progresso
      progressDiv.remove();
      
      // Atualiza status
      const statusSpan = infoDiv.querySelector('.download-item-status');
      if (statusSpan) {
        statusSpan.className = 'download-item-status';
        switch (data.state) {
          case 'completed':
            statusSpan.classList.add('completed');
            statusSpan.textContent = 'Concluído';
            
            // Mostrar notificação de sucesso
            const filename = item.querySelector('.download-item-name')?.textContent || 'Arquivo';
            showDownloadToast('Download concluído', filename, true);
            
            // Auto-fechar painel após 3 segundos se não houver downloads ativos
            if (activeDownloads === 0) {
              setTimeout(() => {
                if (activeDownloads === 0) {
                  downloadsPanel.classList.add('hidden');
                }
              }, 3000);
            }
            // Adiciona botões de ação
            actionsDiv.innerHTML = `
              <button class="download-item-btn" title="Abrir arquivo">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </button>
              <button class="download-item-btn" title="Mostrar na pasta">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            `;
            actionsDiv.querySelector('button:first-child')?.addEventListener('click', () => window.heraAPI.openFile(data.path));
            actionsDiv.querySelector('button:last-child')?.addEventListener('click', () => window.heraAPI.showItemInFolder(data.path));
            break;
          case 'cancelled':
            statusSpan.classList.add('cancelled');
            statusSpan.textContent = 'Cancelado';
            break;
          case 'interrupted':
            statusSpan.classList.add('interrupted');
            statusSpan.textContent = 'Interrompido';
            break;
        }
      }
      
      // Remove tamanho do arquivo
      const sizeSpan = infoDiv.querySelector('.download-item-info > span:last-child');
      if (sizeSpan && sizeSpan !== statusSpan) {
        sizeSpan.remove();
      }
    }
  });

  window.heraAPI.onSetUIVisibility((visible) => {
    [tabBar, navBar, favoritesBar].forEach((el: HTMLElement) => el.style.display = visible ? 'flex' : 'none');
  });

  window.heraAPI.onWindowMaximizedStatus((isMaximized) => {
    maxBtn.classList.toggle('is-maximized', isMaximized);
  });

  window.heraAPI.on('show-history', () => {
    showHistoryPage();
  });

  window.heraAPI.on('show-downloads', () => {
    downloadsPanel.classList.remove('hidden');
  });

  // ========================================// INICIALIZAÇÃO// ========================================
  
  // Inicializa a barra de favoritos (começa oculta, como o find bar)
  console.log('[Init] Inicializando barra de favoritos...');
  favoritesBarWrapper.classList.add('hidden'); // Começa oculta
  // Carrega os favoritos em background, mas mantém oculta
  renderFavoritesBar().then(() => {
    console.log('[Init] Barra de favoritos inicializada (oculta)');
  }).catch(err => {
    console.error('[Init] Erro ao inicializar barra de favoritos:', err);
  });

}); // Fecha o 'DOMContentLoaded'
