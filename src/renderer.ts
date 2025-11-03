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
  const favoritesBar = document.getElementById('favorites-bar')!;
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

  // ========================================// ESTADO DA APLICAÇÃO// ========================================
  let activeTabId: string | null = null;
  const tabsOrder: string[] = [];

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
            // Busca rápida na página - será implementado
          }
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
      historyPage.classList.add('hidden');
      downloadsPanel.classList.add('hidden');
      omniboxSuggestionsEl.classList.add('hidden');
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

  // Omnibox com sugestões (v2.0.0)
  const omniboxSuggestionsEl = document.getElementById('omnibox-suggestions')!;
  
  const renderSuggestions = (suggestions: Array<{ type: 'history' | 'bookmark' | 'search'; title: string; url: string; favicon?: string }>) => {
    if (suggestions.length === 0) {
      omniboxSuggestionsEl.classList.add('hidden');
      return;
    }

    omniboxSuggestionsEl.innerHTML = '';
    omniboxSuggestionsEl.classList.remove('hidden');

    suggestions.forEach((suggestion: { type: 'history' | 'bookmark' | 'search'; title: string; url: string; favicon?: string }, index: number) => {
      const item = document.createElement('div');
      item.className = `omnibox-suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`;
      item.dataset.index = index.toString();
      
      const iconType = suggestion.type === 'bookmark' ? 'star' : suggestion.type === 'history' ? 'clock' : 'search';
      const iconSvg = suggestion.favicon 
        ? `<img src="${suggestion.favicon}" class="omnibox-suggestion-favicon" alt="" onerror="this.style.display='none'">`
        : `<svg class="omnibox-suggestion-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${iconType === 'star' ? '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' : ''}
            ${iconType === 'clock' ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>' : ''}
            ${iconType === 'search' ? '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>' : ''}
          </svg>`;
      
      item.innerHTML = `
        ${iconSvg}
        <div class="omnibox-suggestion-content">
          <div class="omnibox-suggestion-title">${suggestion.title}</div>
          <div class="omnibox-suggestion-url">${suggestion.url}</div>
        </div>
        <span class="omnibox-suggestion-type">${suggestion.type === 'bookmark' ? 'Favorito' : suggestion.type === 'history' ? 'Histórico' : 'Buscar'}</span>
      `;
      
      item.addEventListener('click', () => {
        window.heraAPI.navigateTo(suggestion.url);
        omniboxSuggestionsEl.classList.add('hidden');
        urlInput.blur();
      });
      
      omniboxSuggestionsEl.appendChild(item);
    });
  };

  let suggestionTimeout: NodeJS.Timeout;
  urlInput.addEventListener('input', async (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    
    clearTimeout(suggestionTimeout);
    
    if (query.length < 2) {
      omniboxSuggestionsEl.classList.add('hidden');
      selectedSuggestionIndex = -1;
      return;
    }

    // Debounce para não buscar a cada tecla
    suggestionTimeout = setTimeout(async () => {
      const suggestions = await getOmniboxSuggestions(query);
      renderSuggestions(suggestions);
      selectedSuggestionIndex = -1;
    }, 150);
  });

  urlInput.addEventListener('keydown', async (e) => {
    if (!omniboxSuggestionsEl.classList.contains('hidden')) {
      const items = omniboxSuggestionsEl.querySelectorAll('.omnibox-suggestion-item');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
        items.forEach((item: Element, idx: number) => {
          item.classList.toggle('selected', idx === selectedSuggestionIndex);
        });
        if (selectedSuggestionIndex >= 0) {
          items[selectedSuggestionIndex].scrollIntoView({ block: 'nearest' });
        }
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        items.forEach((item: Element, idx: number) => {
          item.classList.toggle('selected', idx === selectedSuggestionIndex);
        });
        return;
      }
      
      if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        const selectedItem = items[selectedSuggestionIndex] as HTMLElement;
        const url = selectedItem.querySelector('.omnibox-suggestion-url')?.textContent || '';
        if (url) {
          window.heraAPI.navigateTo(url);
          omniboxSuggestionsEl.classList.add('hidden');
          urlInput.blur();
        }
        return;
      }
      
      if (e.key === 'Escape') {
        omniboxSuggestionsEl.classList.add('hidden');
        selectedSuggestionIndex = -1;
        return;
      }
    }
    
    // Enter sem sugestões selecionadas
    if (e.key === 'Enter' && omniboxSuggestionsEl.classList.contains('hidden')) {
      handleUrlSubmit();
    }
  });

  // Fecha sugestões ao clicar fora
  document.addEventListener('click', (e) => {
    const urlBarWrapper = document.getElementById('url-bar-wrapper');
    if (urlBarWrapper && !urlBarWrapper.contains(e.target as Node)) {
      omniboxSuggestionsEl.classList.add('hidden');
    }
  });

  urlInput.addEventListener('focus', () => {
    urlInput.select();
    // Mostra sugestões se houver texto
    if (urlInput.value.trim().length >= 2) {
      getOmniboxSuggestions(urlInput.value.trim()).then(suggestions => {
        renderSuggestions(suggestions);
      });
    }
  });

  // Painel de Downloads
  downloadsBtn.addEventListener('click', () => downloadsPanel.classList.toggle('hidden'));
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
      historyEmpty.querySelector('p')?.textContent = 'Nenhum resultado encontrado';
      historyEmpty.querySelector('span')?.textContent = 'Tente uma busca diferente';
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
        // Remover favorito
        const bookmarksRaw = await window.heraAPI.getBookmarks();
        const bookmarks = validateBookmarks(bookmarksRaw);
        const bookmark = bookmarks.find((b: Bookmark) => b.url === url);
        if (bookmark) {
          await window.heraAPI.removeBookmark(bookmark.id);
          isBookmarked = false;
          bookmarkBtn.classList.remove('active');
        }
      } else {
        // Adicionar favorito
        await window.heraAPI.addBookmark(url, title, favicon);
        isBookmarked = true;
        bookmarkBtn.classList.add('active');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao gerenciar favorito:', error.message);
      } else {
        console.error('Erro ao gerenciar favorito:', error);
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

  const downloadsEmpty = document.getElementById('downloads-empty')!;
  
  window.heraAPI.onDownloadStarted((data) => {
    downloadsPanel.classList.remove('hidden');
    downloadsEmpty.classList.add('hidden');
    const { id, filename, totalBytes } = data;
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
        statusSpan?.textContent = `${(data.receivedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB`;
      }
    }
  });

  window.heraAPI.onDownloadComplete((data) => {
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

}); // Fecha o 'DOMContentLoaded'
