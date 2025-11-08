// External dependencies
import { app, BrowserWindow, BrowserView, ipcMain, shell, session, protocol } from 'electron';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Internal modules
import {
  initDatabase,
  addHistoryEntry,
  getHistory,
  clearHistory,
  closeDatabase,
  getSetting,
  setSetting,
  getAllSettings,
  saveTabsState as saveTabsToDatabase,
  getTabsState as getTabsFromDatabase,
  addBookmark,
  removeBookmark,
  getBookmarks,
  searchBookmarks,
  createBookmarkFolder,
  getBookmarkFolders,
  addDownload,
  updateDownloadProgress,
  updateDownloadState,
  getDownloads,
  clearCompletedDownloads,
  removeDownload
} from './database';

// Types
import type { Bookmark, BookmarkFolder, HistoryEntry, TabState } from './types';
import { 
  validateBookmarks, 
  validateHistoryEntries,
  isValidTabId,
  isValidBookmarkId,
  isValidSettingKey
} from './types/guards';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const PRELOAD_WEB_WEBPACK_ENTRY: string;

// ✅ Importar constantes centralizadas
import {
  TAB_BAR_HEIGHT,
  NAV_BAR_HEIGHT,
  FAVORITES_BAR_HEIGHT,
  FIND_BAR_HEIGHT,
  DEFAULT_USER_AGENT
} from './constants';

// Estado da UI
let isFavoritesBarHidden = true; // Barra de favoritos é global (aparece em todas as abas)

// Estado da barra de busca por aba
const tabFindBarStates = new Map<string, boolean>(); // tabId -> isVisible

// Função para calcular altura da UI dinamicamente para a aba ativa
function getUIHeight(): number {
  const isFindBarVisible = activeTabId ? (tabFindBarStates.get(activeTabId) || false) : false;
  return TAB_BAR_HEIGHT + NAV_BAR_HEIGHT + (isFavoritesBarHidden ? 0 : FAVORITES_BAR_HEIGHT) + (isFindBarVisible ? FIND_BAR_HEIGHT : 0);
}

/**
 * Determina qual preload usar baseado na URL
 * 
 * @param url - URL que será carregada
 * @returns Caminho do preload apropriado
 * 
 * SEGURANÇA:
 * - URLs internas (hera://) usam preload-ui.ts (privilegiado, acesso completo)
 * - URLs externas usam preload-web.ts (limitado, sem acesso ao banco de dados)
 */
const getPreloadForUrl = (url: string): string => {
  // URLs internas são confiáveis - usam preload privilegiado
  if (url.startsWith('hera://')) {
    console.log(`[Preload] URL interna detectada: ${url}`);
    console.log(`[Preload] Usando preload privilegiado: ${MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY}`);
    return MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;
  }

  // URLs externas NÃO são confiáveis - usam preload limitado
  console.log(`[Preload] URL externa detectada: ${url}`);
  console.log(`[Preload] Usando preload limitado: ${PRELOAD_WEB_WEBPACK_ENTRY}`);
  return PRELOAD_WEB_WEBPACK_ENTRY;
};

let mainWindow: BrowserWindow;
const tabs = new Map<string, BrowserView>();
const tabInfo = new Map<string, { url: string; title: string; favicon?: string }>(); // Armazena info das abas para persistência
let activeTabId: string | null = null;
let menuView: BrowserView;
let isMenuVisible = false;
let dynamicMenuHeight = 250; // Default or approximated height
let omniboxView: BrowserView;

// --- Histórico ---
// Agora usando SQLite através do módulo database.ts
// --- Fim do Histórico ---

// --- Protocolo ---
// Deve ser chamado ANTES de app.on('ready') ou app.whenReady()
protocol.registerSchemesAsPrivileged([
  { scheme: 'hera', privileges: { standard: true, secure: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true } }
]);
// --- FIM ---

// Verifica se é um update do Squirrel (Windows installer)
if (require('electron-squirrel-startup')) {
  app.quit();
  process.exit(0);
}

// --- Funções de Aba ---
const resizeActiveTab = () => {
  if (activeTabId && tabs.has(activeTabId)) {
    const activeView = tabs.get(activeTabId);
    if (!activeView) return;
    const [width, height] = mainWindow.getContentSize();
    const uiHeight = getUIHeight();
    activeView.setBounds({ x: 0, y: uiHeight, width: width, height: height - uiHeight });
  }
};

const switchToTab = (id: string) => {
  if (!tabs.has(id)) return;
  if (activeTabId && tabs.has(activeTabId)) {
    const oldView = tabs.get(activeTabId);
    if (oldView) {
      // Para a busca na aba anterior ao trocar
      oldView.webContents.stopFindInPage('clearSelection');
      mainWindow.removeBrowserView(oldView);
    }
  }
  const view = tabs.get(id);
  if (!view) return;
  mainWindow.setBrowserView(view);
  activeTabId = id;
  resizeActiveTab();
  
  // Envia tab-switched primeiro para atualizar activeTabId no renderer
  mainWindow.webContents.send('tab-switched', id, view.webContents.getURL());
  
  // Depois restaura o estado da barra de busca (precisa do activeTabId atualizado)
  // Usa setImmediate para garantir que tab-switched foi processado
  setImmediate(() => {
    mainWindow.webContents.send('find:restore-state');
  });
};

// --- MUDANÇA v2.2 ---
// Agora 'url' pode ser undefined, e aí usamos o padrão
const createNewTab = (url: string | undefined = undefined) => {
  const finalUrl = url || 'hera://new-tab'; // Se a URL for nula, abre a new-tab

  const id = uuidv4();

  // Determina a partition baseada na URL
  // URLs internas (hera://) não precisam de persistência (usa sessão padrão)
  // URLs externas usam partition compartilhada para manter sessões (WhatsApp, etc)
  const partition = finalUrl.startsWith('hera://') ? undefined : 'persist:web-content';

  const view = new BrowserView({
    webPreferences: {
      preload: getPreloadForUrl(finalUrl),
      // Persiste cookies, cache e localStorage apenas para sites externos
      partition: partition,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  tabs.set(id, view);

  // Determinar título e favicon inicial
  let initialTitle = 'Nova Aba';
  let initialFavicon: string | undefined;

  if (finalUrl.startsWith('hera://')) {
    initialTitle = finalUrl.includes('settings') ? 'Configurações' :
      finalUrl.includes('new-tab') ? 'Nova Aba' :
        finalUrl.includes('history') ? 'Histórico' :
          finalUrl.includes('downloads') ? 'Downloads' : 'Hera Browser';
    // Usa o protocolo hera:// para servir o ícone
    initialFavicon = 'hera://HeraBrowser256x256.png';
  }

  // Armazena informações da aba para persistência
  tabInfo.set(id, { url: finalUrl, title: initialTitle, favicon: initialFavicon });

  switchToTab(id);
  view.webContents.loadURL(finalUrl);

  mainWindow.webContents.send('tab-created', { id, title: initialTitle, url: finalUrl, favicon: initialFavicon });

  // Handler para abrir links em nova janela/aba
  view.webContents.setWindowOpenHandler(({ url }) => {
    // Se for um link interno (hera://), abre em nova aba
    if (url.startsWith('hera://')) {
      createNewTab(url);
      return { action: 'deny' };
    }
    // Se for um link externo, abre em nova aba do navegador
    if (url.startsWith('http://') || url.startsWith('https://')) {
      createNewTab(url);
      return { action: 'deny' };
    }
    // Para outros protocolos (mailto:, tel:, etc), abre no app padrão do sistema
    // MAS NÃO tenta abrir hera:// externamente
    if (!url.startsWith('hera://')) {
      shell.openExternal(url).catch(err => {
        console.error('Erro ao abrir URL externa:', err);
      });
    }
    return { action: 'deny' };
  });



  // Captura erros de carregamento para páginas internas
  view.webContents.on('did-fail-load', (_event, errorCode, _errorDescription, validatedURL) => {
    // Se for um erro com protocolo hera://, tenta recarregar uma vez
    if (validatedURL.startsWith('hera://') && errorCode !== 0) {
      setTimeout(() => {
        view.webContents.loadURL(validatedURL).catch(() => {
          console.error(`Falha ao carregar página interna: ${validatedURL}`);
        });
      }, 100);
    }
  });

  // DevTools - F12 para abrir/fechar (nas abas também - painel integrado)
  view.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12' || (input.key === 'I' && input.control && input.shift)) {
      if (view.webContents.isDevToolsOpened()) {
        view.webContents.closeDevTools();
      } else {
        view.webContents.openDevTools({ mode: 'bottom' });
      }
    }
  });

  // Listeners
  view.webContents.on('did-start-loading', () => {
    mainWindow.webContents.send('tab-loading', id, true);
  });
  view.webContents.on('did-stop-loading', () => {
    mainWindow.webContents.send('tab-loading', id, false);
    // Garante que a URL seja atualizada quando a página parar de carregar
    const currentUrl = view.webContents.getURL();
    if (currentUrl) {
      // Sempre atualiza URL para garantir sincronização
      mainWindow.webContents.send('tab-updated', id, { url: currentUrl });

      // Para páginas internas, garantir que o ícone do navegador seja mantido
      if (currentUrl.startsWith('hera://')) {
        const heraIconUrl = 'hera://HeraBrowser256x256.png';
        mainWindow.webContents.send('tab-updated', id, { favicon: heraIconUrl });
      }
    }
  });
  // Função auxiliar para resolver URL relativa de favicon
  const resolveFaviconUrl = (faviconUrl: string, baseUrl: string): string => {
    try {
      // Se já é uma URL absoluta, retorna como está
      if (faviconUrl.startsWith('http://') || faviconUrl.startsWith('https://') || faviconUrl.startsWith('data:')) {
        return faviconUrl;
      }
      // Se começa com //, adiciona o protocolo
      if (faviconUrl.startsWith('//')) {
        try {
          const baseUrlObj = new URL(baseUrl);
          return `${baseUrlObj.protocol}${faviconUrl}`;
        } catch {
          return `https:${faviconUrl}`;
        }
      }
      // Se começa com /, é relativo à raiz do domínio
      if (faviconUrl.startsWith('/')) {
        try {
          const baseUrlObj = new URL(baseUrl);
          return `${baseUrlObj.protocol}//${baseUrlObj.host}${faviconUrl}`;
        } catch {
          return faviconUrl;
        }
      }
      // Caso contrário, é relativo ao caminho atual
      try {
        const baseUrlObj = new URL(baseUrl);
        const pathParts = baseUrlObj.pathname.split('/');
        pathParts.pop(); // Remove o último elemento (arquivo)
        const basePath = pathParts.join('/') || '/';
        return `${baseUrlObj.protocol}//${baseUrlObj.host}${basePath}/${faviconUrl}`;
      } catch {
        return faviconUrl;
      }
    } catch (error: unknown) {
      console.error('Erro ao resolver URL do favicon:', error);
      return faviconUrl;
    }
  };

  view.webContents.on('did-finish-load', () => {
    const title = view.webContents.getTitle();
    const url = view.webContents.getURL();

    // SEMPRE envia a URL primeiro para garantir que seja atualizada na barra de endereço
    mainWindow.webContents.send('tab-updated', id, { url });

    // Para páginas internas (hera://), usar ícone do navegador via protocolo hera://
    if (url.startsWith('hera://')) {
      // Usa o protocolo hera:// para servir o ícone (já está configurado no protocol handler)
      const heraIconUrl = 'hera://HeraBrowser256x256.png';
      mainWindow.webContents.send('tab-updated', id, { favicon: heraIconUrl, title });
      // Atualiza info da aba
      if (tabInfo.has(id)) {
        const info = tabInfo.get(id);
        if (info) {
          info.url = url;
          info.title = title || info.title;
          info.favicon = heraIconUrl;
        }
      }
    } else {

      // Tenta obter o favicon quando a página carregar
      // Usa um pequeno delay para garantir que o DOM esteja completamente carregado
      setTimeout(() => {
        view.webContents.executeJavaScript(`
          (function() {
            const links = Array.from(document.querySelectorAll('link[rel*="icon"]'));
            if (links.length > 0) {
              return links[0].href;
            }
            // Fallback para favicon padrão
            try {
              const url = new URL('/favicon.ico', window.location.href);
              return url.href;
            } catch {
              return null;
            }
          })();
        `).then((faviconUrl: string | null) => {
          if (faviconUrl) {
            const resolvedUrl = resolveFaviconUrl(faviconUrl, url);
            mainWindow.webContents.send('tab-updated', id, { favicon: resolvedUrl });
          }
        }).catch(() => {
          // Ignora erros ao tentar obter favicon via JavaScript
        });
      }, 100);

      // Envia título também
      if (title) {
        mainWindow.webContents.send('tab-updated', id, { title });
        // Atualiza info da aba
        if (tabInfo.has(id)) {
          const info = tabInfo.get(id);
          if (info) {
            info.url = url;
            info.title = title;
          }
        }
      } else if (tabInfo.has(id)) {
        // Se não houver título, pelo menos atualiza a URL
        const info = tabInfo.get(id);
        if (info) {
          info.url = url;
        }
      }

      // Adiciona ao histórico DEPOIS de garantir que temos URL e título
      if (url && !url.startsWith('hera://')) {
        const finalTitle = title || url;
        try {
          addHistoryEntry(url, finalTitle);
        } catch (err: unknown) {
          console.error('Erro ao adicionar ao histórico:', err);
        }
      }
    }
  });

  view.webContents.on('did-navigate', (_event, navigateUrl) => {
    mainWindow.webContents.send('tab-updated', id, { url: navigateUrl });

    // Atualiza info da aba
    if (tabInfo.has(id)) {
      const info = tabInfo.get(id);
      if (info) {
        info.url = navigateUrl;
      }
    }

    // Tenta buscar favicon imediatamente após navegação (apenas para sites externos)
    if (!navigateUrl.startsWith('hera://')) {
      setTimeout(() => {
        view.webContents.executeJavaScript(`
          (function() {
            const links = Array.from(document.querySelectorAll('link[rel*="icon"]'));
            if (links.length > 0) {
              return links[0].href;
            }
            return null;
          })();
        `).then((faviconUrl: string | null) => {
          if (faviconUrl) {
            const resolvedUrl = resolveFaviconUrl(faviconUrl, navigateUrl);
            mainWindow.webContents.send('tab-updated', id, { favicon: resolvedUrl });
            // Atualiza info da aba
            if (tabInfo.has(id)) {
              const info = tabInfo.get(id);
              if (info) {
                info.favicon = resolvedUrl;
                info.url = navigateUrl;
              }
            }
          } else {
            // Fallback para favicon.ico padrão
            try {
              const urlObj = new URL(navigateUrl);
              const defaultFavicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
              mainWindow.webContents.send('tab-updated', id, { favicon: defaultFavicon });
              // Atualiza info da aba
              if (tabInfo.has(id)) {
                const info = tabInfo.get(id);
                if (info) {
                  info.favicon = defaultFavicon;
                  info.url = navigateUrl;
                }
              }
            } catch (e) {
              // Ignora erros
            }
          }
        }).catch(() => {
          // Tenta favicon.ico padrão como último recurso
          try {
            const urlObj = new URL(navigateUrl);
            const defaultFavicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
            mainWindow.webContents.send('tab-updated', id, { favicon: defaultFavicon });
            // Atualiza info da aba
            if (tabInfo.has(id)) {
              const info = tabInfo.get(id);
              if (info) {
                info.favicon = defaultFavicon;
                info.url = navigateUrl;
              }
            }
          } catch (e) {
            // Ignora erros
          }
        });
      }, 200);
    }
  });

  // Captura navegação dentro da mesma página (SPA/History API)
  view.webContents.on('did-navigate-in-page', (_event, url) => {
    mainWindow.webContents.send('tab-updated', id, { url });
    // Atualiza info da aba
    if (tabInfo.has(id)) {
      const info = tabInfo.get(id);
      if (info) {
        info.url = url;
      }
    }
  });

  view.webContents.on('page-title-updated', (_event, title) => {
    mainWindow.webContents.send('tab-updated', id, { title });
    // Atualiza info da aba
    if (tabInfo.has(id)) {
      const info = tabInfo.get(id);
      if (info) {
        info.title = title;
      }
    }
  });

  view.webContents.on('page-favicon-updated', (_event, favicons) => {
    const currentUrl = view.webContents.getURL();

    // Para páginas internas, não atualizar favicon (já foi definido)
    if (currentUrl.startsWith('hera://')) {
      return;
    }

    if (favicons && favicons.length > 0) {
      const resolvedUrl = resolveFaviconUrl(favicons[0], currentUrl);
      mainWindow.webContents.send('tab-updated', id, { favicon: resolvedUrl });
      // Atualiza info da aba
      if (tabInfo.has(id)) {
        const info = tabInfo.get(id);
        if (info) {
          info.favicon = resolvedUrl;
        }
      }
    } else {
      // Se não houver favicon, tenta buscar o favicon.ico padrão
      try {
        const urlObj = new URL(currentUrl);
        const defaultFavicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
        mainWindow.webContents.send('tab-updated', id, { favicon: defaultFavicon });
      } catch (e) {
        // Ignora erros
      }
    }
  });

  // Find in page listener
  view.webContents.on('found-in-page', (_event, result) => {
    // Só envia resultado se esta aba for a ativa
    if (activeTabId === id) {
      mainWindow.webContents.send('find:result', {
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches,
        finalUpdate: result.finalUpdate
      });
    }
  });

};

const closeTab = (id: string) => {
  if (!tabs.has(id)) return;
  const view = tabs.get(id);
  
  // Para qualquer busca ativa antes de fechar
  if (view && view.webContents) {
    view.webContents.stopFindInPage('clearSelection');
  }
  
  mainWindow.removeBrowserView(view);
  tabs.delete(id);
  tabInfo.delete(id); // Remove info da aba também
  tabFindBarStates.delete(id); // Remove estado da barra de busca
  mainWindow.webContents.send('tab-closed', id);

  if (activeTabId === id) {
    if (tabs.size > 0) {
      const lastTabId = tabs.keys().next().value;
      switchToTab(lastTabId);
    } else {
      createNewTab();
    }
  }

  // Salva estado das abas após fechar uma aba
  try {
    const tabsArray: TabState[] = Array.from(tabs.keys()).map((id, index) => {
      const info = tabInfo.get(id);
      return {
        id,
        url: info?.url || '',
        title: info?.title || '',
        favicon: info?.favicon,
        position: index,
        active: id === activeTabId
      };
    });
    saveTabsToDatabase(tabsArray);
  } catch (err: unknown) {
    console.error('Erro ao salvar estado das abas:', err);
  }
};

// --- Janela Principal ---
const createWindow = (): void => {
  const iconPath = path.join(app.getAppPath(), 'src', 'HeraBrowser512x512.png');

  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    frame: false,
    autoHideMenuBar: true,
    icon: iconPath,
    backgroundColor: '#2b2b2b',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // DevTools - F12 para abrir/fechar (painel integrado)
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12' || (input.key === 'I' && input.control && input.shift)) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools({ mode: 'bottom' });
      }
    }
  });

  // Listeners de Janela
  mainWindow.on('enter-full-screen', () => {
    mainWindow.setFullScreen(true);
    mainWindow.webContents.send('set-ui-visibility', false);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.setFullScreen(false);
    mainWindow.webContents.send('set-ui-visibility', true);
  });
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized-status', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized-status', false);
  });

  // Create menu view
  menuView = new BrowserView({
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      transparent: true,
    }
  });
  menuView.webContents.loadURL('hera://menu');
  // menuView.webContents.openDevTools({ mode: 'detach' });

  // Get menu height after it loads
  menuView.webContents.on('did-finish-load', async () => {
    const height = await menuView.webContents.executeJavaScript(
      'document.getElementById("main-menu").offsetHeight'
    );

    dynamicMenuHeight = height;
  });

  // Create omnibox view (similar to menu)
  omniboxView = new BrowserView({
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      transparent: true,
    }
  });
  omniboxView.webContents.loadURL('hera://omnibox');
  omniboxView.setBackgroundColor('#00000000'); // Transparent

  mainWindow.on('resize', resizeActiveTab);
};

// --- Funções de Histórico ---
// Agora usando SQLite - funções movidas para database.ts

// --- O CORAÇÃO DA APLICAÇÃO ---
app.whenReady().then(async () => {
  // Inicializar banco de dados SQLite
  try {
    initDatabase(); // Agora é síncrono com better-sqlite3
    console.log('Banco de dados SQLite inicializado');
  } catch (error: unknown) {
    console.error('❌ ERRO CRÍTICO ao inicializar banco de dados:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
    // Tentar novamente após um delay
    setTimeout(() => {
      try {
        console.log('Tentando inicializar banco novamente...');
        initDatabase();
        console.log('✅ Banco inicializado na segunda tentativa');
      } catch (retryError) {
        console.error('❌ Falha na segunda tentativa:', retryError);
      }
    }, 1000);
  }

  // Configurar User Agent global para todas as sessões
  session.defaultSession.setUserAgent(DEFAULT_USER_AGENT);

  // Configurar sessão persistente para sites externos
  const webSession = session.fromPartition('persist:web-content');
  webSession.setUserAgent(DEFAULT_USER_AGENT);

  // Configurar permissões para ambas as sessões
  const allowedPermissions = [
    'media',
    'mediaKeySystem',
    'geolocation',
    'notifications',
    'midi',
    'midiSysex',
    'pointerLock',
    'fullscreen',
    'openExternal',
    'clipboard-read',
    'clipboard-sanitized-write'
  ];

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(allowedPermissions.includes(permission));
  });

  webSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(allowedPermissions.includes(permission));
  });

  // --- Gerenciamento de Downloads ---
  webSession.on('will-download', (_event, item) => {
    const id = uuidv4(); // ✅ Gerar ID único para o download
    const filename = item.getFilename();
    const totalBytes = item.getTotalBytes();
    const savePath = item.getSavePath();
    
    console.log('[Download] Iniciando download:', filename, 'ID:', id);
    
    // ✅ Salvar no banco de dados
    try {
      addDownload(id, filename, savePath, totalBytes);
    } catch (error) {
      console.error('[Download] Falha ao salvar no DB:', error);
    }
    
    // Enviar evento de download iniciado
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('download-started', {
        id,
        filename,
        savePath,
        totalBytes
      });
    }

    // Atualizar progresso
    item.on('updated', (_event, state) => {
      if (state === 'progressing') {
        const receivedBytes = item.getReceivedBytes();
        
        // ✅ Atualizar no banco de dados
        try {
          updateDownloadProgress(id, receivedBytes);
        } catch (error) {
          console.error('[Download] Falha ao atualizar progresso no DB:', error);
        }
        
        if (mainWindow) {
          mainWindow.webContents.send('download-progress', {
            id,
            savePath: item.getSavePath(),
            receivedBytes,
            totalBytes: item.getTotalBytes()
          });
        }
      }
    });

    // Download concluído
    item.once('done', (_event, state) => {
      const finalPath = item.getSavePath();
      const finalState = state === 'completed' ? 'completed' : 'failed';
      
      console.log('[Download] Concluído:', filename, 'Estado:', finalState, 'ID:', id);
      
      // ✅ Atualizar estado final no banco de dados
      try {
        updateDownloadState(id, finalState, finalPath);
      } catch (error) {
        console.error('[Download] Falha ao finalizar no DB:', error);
      }
      
      if (mainWindow) {
        mainWindow.webContents.send('download-complete', {
          id,
          savePath: finalPath,
          state: finalState
        });
      }
    });
  });

  // --- Handler do Protocolo (MUDANÇA v2.2) ---
  const getMimeType = (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.css') return 'text/css';
    if (ext === '.js') return 'text/javascript';
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.svg') return 'image/svg+xml';
    if (ext === '.woff2') return 'font/woff2';
    return 'text/html';
  };

  protocol.handle('hera', (request) => {
    try {
      const url = new URL(request.url);
      const host = url.hostname;
      const pathname = url.pathname;
      // Quando empacotado, os arquivos estão em .webpack/main dentro do asar
      // Quando em desenvolvimento, estão em src
      const appPath = app.isPackaged 
        ? path.join(app.getAppPath(), '.webpack', 'main')
        : path.join(app.getAppPath(), 'src');

      if (host === 'navigate-from-newtab') {
        const targetUrl = url.searchParams.get('url');
        if (activeTabId && targetUrl) {
          const activeView = tabs.get(activeTabId);
          if (activeView) {
            // Usa função assíncrona para buscar configuração do mecanismo de busca
            (async () => {
              let finalUrl = targetUrl;
              const isUrl = /^(https?:\/\/)|(localhost)|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/.test(targetUrl);

              if (isUrl) {
                if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                  finalUrl = `https://${targetUrl}`;
                }
              } else {
                // Busca o mecanismo de busca configurado pelo usuário
                const searchEngine = getSetting('searchEngine') || 'google';
                const searchEngines: Record<string, string> = {
                  google: `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`,
                  brave: `https://search.brave.com/search?q=${encodeURIComponent(targetUrl)}`,
                  duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(targetUrl)}`
                };
                finalUrl = searchEngines[searchEngine] || searchEngines.google;
              }
              activeView.webContents.loadURL(finalUrl);
            })().catch((err: unknown) => {
              console.error('Erro ao processar navegação:', err);
            });
          }
        }
        return new Response(null, { status: 204 });
      }

      // Rota para servir arquivos
      let filePath = '';
      if (host === 'new-tab') {
        if (pathname === '/' || pathname === '') {
          filePath = path.join(appPath, 'new-tab.html');
        } else {
          filePath = path.join(appPath, pathname);
        }
      }
      // --- MUDANÇA v2.2: Adiciona a rota de settings --- 
      else if (host === 'settings') {
        if (pathname === '/' || pathname === '') {
          filePath = path.join(appPath, 'settings.html');
        } else {
          // Para o settings.css, hera_logo.png, etc.
          filePath = path.join(appPath, pathname);
        }
      } else if (host === 'menu') {
        if (pathname === '/' || pathname === '') {
          filePath = path.join(appPath, 'menu.html');
        } else {
          filePath = path.join(appPath, pathname);
        }
      } else if (host === 'history') {
        if (pathname === '/' || pathname === '') {
          filePath = path.join(appPath, 'history.html');
        } else {
          filePath = path.join(appPath, pathname);
        }
      } else if (host === 'downloads') {
        if (pathname === '/' || pathname === '') {
          filePath = path.join(appPath, 'downloads.html');
        } else {
          filePath = path.join(appPath, pathname);
        }
      } else if (host === 'omnibox') {
        if (pathname === '/' || pathname === '') {
          filePath = path.join(appPath, 'omnibox.html');
        } else {
          filePath = path.join(appPath, pathname);
        }
      }
      // --- FIM DA MUDANÇA ---
      // Caso especial para arquivos de imagem e outros recursos na raiz
      else if (host.endsWith('.png') || host.endsWith('.jpg') || host.endsWith('.svg') || host.endsWith('.ico')) {
        filePath = path.join(appPath, host);
      }
      else {
        filePath = path.join(appPath, host, pathname);
      }
      filePath = path.normalize(filePath);
      
      console.log(`[Protocol Handler] Tentando carregar: ${filePath}`);
      console.log(`[Protocol Handler] appPath: ${appPath}`);
      console.log(`[Protocol Handler] host: ${host}`);
      console.log(`[Protocol Handler] pathname: ${pathname}`);
      
      if (!filePath.startsWith(appPath)) {
        console.error(`[Protocol Handler] Access Denied: ${filePath} não começa com ${appPath}`);
        return new Response('Access Denied', { status: 403 });
      }

      // Tenta encontrar o arquivo (case-insensitive se não existir)
      let finalFilePath = filePath;
      if (!fs.existsSync(filePath)) {
        // Tenta buscar o arquivo com case-insensitive
        const dir = path.dirname(filePath);
        const fileName = path.basename(filePath);
        
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const foundFile = files.find(f => f.toLowerCase() === fileName.toLowerCase());
          if (foundFile) {
            finalFilePath = path.join(dir, foundFile);
            console.log(`[Protocol Handler] Arquivo encontrado com case-insensitive: ${finalFilePath}`);
          }
        }
      }

      if (fs.existsSync(finalFilePath)) {
        console.log(`[Protocol Handler] Arquivo encontrado: ${finalFilePath}`);
        const fileContent = fs.readFileSync(finalFilePath);
        const mimeType = getMimeType(finalFilePath);
        return new Response(fileContent, {
          status: 200,
          headers: { 'Content-Type': mimeType }
        });
      } else {
        console.error(`[Protocol Handler] File not found: ${filePath}`);
        return new Response('Not Found', { status: 404 });
      }

    } catch (error: unknown) {
      console.error(`Falha ao lidar com o protocolo hera: ${error}`);
      return new Response('Internal Server Error', { status: 500 });
    }
  });
  // --- FIM ---

  // --- Handlers de IPC (MUDANÇA v2.2) ---
  // Agora 'createNewTab' recebe a URL (que pode ser undefined)
  ipcMain.handle('tab:new', (_e, url?: string) => {
    // Validate input parameter
    if (url !== undefined && typeof url !== 'string') {
      console.error('URL inválida fornecida para tab:new');
      return createNewTab();
    }
    return createNewTab(url);
  });

  ipcMain.handle('tab:switch', (_e, id: string) => {
    // ✅ Validação robusta
    if (!isValidTabId(id)) {
      console.error('tab:switch foi chamado com ID inválido:', id);
      return;
    }
    return switchToTab(id);
  });

  ipcMain.handle('tab:close', (_e, id: string) => {
    // ✅ Validação robusta
    if (!isValidTabId(id)) {
      console.error('tab:close foi chamado com ID inválido:', id);
      return;
    }
    return closeTab(id);
  });

  ipcMain.handle('nav:back', () => {
    const activeView = tabs.get(activeTabId);
    if (activeView && activeView.webContents.navigationHistory.canGoBack()) {
      activeView.webContents.goBack();
    }
  });
  ipcMain.handle('nav:forward', () => {
    const activeView = tabs.get(activeTabId);
    if (activeView && activeView.webContents.navigationHistory.canGoForward()) {
      activeView.webContents.goForward();
    }
  });
  ipcMain.handle('nav:reload', () => tabs.get(activeTabId)?.webContents.reload());
  ipcMain.handle('nav:to', async (_e, url: string) => {
    if (typeof url !== 'string' || !url.trim()) {
      console.error('URL inválida fornecida para nav:to');
      return;
    }

    const tab = tabs.get(activeTabId);
    if (!tab) {
      console.error('Aba ativa não encontrada');
      return;
    }

    try {
      await tab.webContents.loadURL(url);
    } catch (error: unknown) {
      // ERR_ABORTED (-3) é comum quando o usuário navega rapidamente
      // Não é um erro crítico, apenas log para debug
      if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'ERR_ABORTED') {
        console.log('Navegação cancelada (usuário navegou para outra página)');
      } else {
        console.error('Erro ao navegar:', error);
        throw error;
      }
    }
  });

  ipcMain.handle('nav:get-state', () => {
    if (!activeTabId || !tabs.has(activeTabId)) {
      return { canGoBack: false, canGoForward: false };
    }
    const view = tabs.get(activeTabId);
    return {
      canGoBack: view.webContents.navigationHistory.canGoBack(),
      canGoForward: view.webContents.navigationHistory.canGoForward()
    };
  });

  // Find in page handlers
  ipcMain.on('find:start', (_event, args: { text: string }) => {
    if (!activeTabId || !tabs.has(activeTabId)) {
      console.error('Nenhuma aba ativa para busca');
      return;
    }

    const view = tabs.get(activeTabId);
    if (!view) return;

    // Valida input
    if (typeof args.text !== 'string' || args.text.trim().length === 0) {
      console.error('Texto de busca inválido');
      return;
    }

    // Inicia busca
    view.webContents.findInPage(args.text, {
      findNext: false,
      forward: true
    });
  });

  ipcMain.on('find:next', (_event, args: { text: string; forward: boolean }) => {
    if (!activeTabId || !tabs.has(activeTabId)) {
      console.error('Nenhuma aba ativa para navegação');
      return;
    }

    const view = tabs.get(activeTabId);
    if (!view) return;

    // Valida input
    if (typeof args.text !== 'string' || args.text.trim().length === 0) {
      console.error('Texto de busca inválido');
      return;
    }

    if (typeof args.forward !== 'boolean') {
      console.error('Direção de navegação inválida');
      return;
    }

    // Navega para próximo/anterior
    view.webContents.findInPage(args.text, {
      findNext: true,
      forward: args.forward
    });
  });

  ipcMain.on('find:stop', () => {
    if (!activeTabId || !tabs.has(activeTabId)) {
      return;
    }

    const view = tabs.get(activeTabId);
    if (!view) return;

    // Para busca e limpa seleção
    view.webContents.stopFindInPage('clearSelection');
  });

  // Handlers temporariamente desabilitados - voltando para solução simples
  ipcMain.on('omnibox:show', () => {
    // Não faz nada por enquanto
  });

  ipcMain.on('omnibox:hide', () => {
    // Não faz nada por enquanto
  });

  ipcMain.on('omnibox:select', () => {
    // Não faz nada por enquanto
  });

  ipcMain.on('omnibox:update-selection', () => {
    // Não faz nada por enquanto
  });

  ipcMain.on('omnibox:select-current', () => {
    // Não faz nada por enquanto
  });

  ipcMain.on('menu:toggle', () => {
    if (isMenuVisible) {
      mainWindow.removeBrowserView(menuView);
    } else {
      mainWindow.addBrowserView(menuView);
      const menuWidth = 280;
      const [windowWidth] = mainWindow.getContentSize();
      menuView.setBounds({
        x: windowWidth - menuWidth - 10,
        y: NAV_BAR_HEIGHT,
        width: menuWidth,
        height: dynamicMenuHeight
      });
      mainWindow.setTopBrowserView(menuView);
      menuView.webContents.focus();
    }
    isMenuVisible = !isMenuVisible;
  });

  ipcMain.on('menu:action', (_event, action: string) => {
    // Hide the menu first
    if (isMenuVisible) {
      mainWindow.removeBrowserView(menuView);
      isMenuVisible = false;
    }

    switch (action) {
      case 'new-tab':
        createNewTab();
        break;
      case 'history':
        createNewTab('hera://history');
        break;
      case 'downloads':
        createNewTab('hera://downloads');
        break;
      case 'settings':
        createNewTab('hera://settings');
        break;
      case 'exit':
        mainWindow.close();
        break;
    }
  });

  // ... (handlers de window, download, history sem mudanças) ...
  ipcMain.handle('window:minimize', () => mainWindow.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.handle('window:close', () => mainWindow.close());

  ipcMain.handle('history:get', (): HistoryEntry[] => {
    try {
      const history = getHistory(); // Agora é síncrono
      return validateHistoryEntries(history);
    } catch (error: unknown) {
      console.error('Erro ao obter histórico:', error);
      return [];
    }
  });
  ipcMain.handle('history:clear', (): void => {
    try {
      clearHistory();
    } catch (error: unknown) {
      console.error('Erro ao limpar histórico:', error);
      throw error;
    }
  });

  // Downloads handlers
  ipcMain.handle('downloads:get', () => {
    try {
      return getDownloads();
    } catch (error: unknown) {
      console.error('Erro ao buscar downloads:', error);
      return [];
    }
  });

  ipcMain.handle('downloads:clear-completed', () => {
    try {
      clearCompletedDownloads();
    } catch (error: unknown) {
      console.error('Erro ao limpar downloads:', error);
      throw error;
    }
  });

  ipcMain.handle('downloads:remove', (_e, id: string) => {
    try {
      if (typeof id !== 'string' || !id) {
        throw new Error('ID de download inválido');
      }
      return removeDownload(id);
    } catch (error: unknown) {
      console.error('Erro ao remover download:', error);
      return false;
    }
  });

  // Settings handlers
  ipcMain.handle('settings:get', async (_e, key: string): Promise<string | null> => {
    try {
      // ✅ Validação robusta
      if (!isValidSettingKey(key)) {
        throw new Error('Chave de configuração inválida');
      }

      return getSetting(key);
    } catch (error: unknown) {
      console.error('Erro ao obter configuração:', error);
      return null;
    }
  });

  ipcMain.handle('settings:set', async (_e, key: string, value: string): Promise<boolean> => {
    try {
      // ✅ Validação robusta
      if (!isValidSettingKey(key)) {
        throw new Error('Chave de configuração inválida');
      }
      if (typeof value !== 'string') {
        throw new Error('Valor de configuração inválido');
      }

      setSetting(key, value);
      return true;
    } catch (error: unknown) {
      console.error('Erro ao salvar configuração:', error);
      throw error;
    }
  });

  ipcMain.handle('settings:getAll', (): Record<string, string> => {
    try {
      return getAllSettings();
    } catch (error: unknown) {
      console.error('Erro ao obter todas as configurações:', error);
      return {};
    }
  });

  // Bookmark handlers
  ipcMain.handle('bookmark:add', async (_e, url: string, title: string, favicon?: string, folderId?: string): Promise<Bookmark> => {
    try {
      // Validate input parameters
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error('URL inválida');
      }
      if (typeof title !== 'string' || !title.trim()) {
        throw new Error('Título inválido');
      }
      if (favicon !== undefined && typeof favicon !== 'string') {
        throw new Error('Favicon inválido');
      }
      if (folderId !== undefined && typeof folderId !== 'string') {
        throw new Error('ID da pasta inválido');
      }

      return addBookmark(url, title, favicon, folderId);
    } catch (error: unknown) {
      console.error('Erro ao adicionar favorito:', error);
      throw error;
    }
  });

  ipcMain.handle('bookmark:remove', async (_e, id: string): Promise<boolean> => {
    try {
      // ✅ Validação robusta
      if (!isValidBookmarkId(id)) {
        throw new Error('ID de bookmark inválido');
      }

      removeBookmark(id);
      return true;
    } catch (error: unknown) {
      console.error('Erro ao remover favorito:', error);
      throw error;
    }
  });

  ipcMain.handle('bookmark:get', async (_e, folderId?: string): Promise<Bookmark[]> => {
    try {
      // Validate input parameter
      if (folderId !== undefined && typeof folderId !== 'string') {
        throw new Error('ID da pasta inválido');
      }

      const bookmarks = getBookmarks(folderId);
      return validateBookmarks(bookmarks);
    } catch (error: unknown) {
      console.error('Erro ao buscar favoritos:', error);
      return [];
    }
  });

  ipcMain.handle('bookmark:search', async (_e, query: string): Promise<Bookmark[]> => {
    try {
      // Validate input parameter
      if (typeof query !== 'string') {
        throw new Error('Query de busca inválida');
      }

      const bookmarks = searchBookmarks(query);
      return validateBookmarks(bookmarks);
    } catch (error: unknown) {
      console.error('Erro ao buscar favoritos:', error);
      return [];
    }
  });

  ipcMain.handle('bookmark:create-folder', async (_e, name: string, parentId?: string): Promise<BookmarkFolder> => {
    try {
      // Validate input parameters
      if (typeof name !== 'string' || !name.trim()) {
        throw new Error('Nome da pasta inválido');
      }
      if (parentId !== undefined && typeof parentId !== 'string') {
        throw new Error('ID da pasta pai inválido');
      }

      return createBookmarkFolder(name, parentId);
    } catch (error: unknown) {
      console.error('Erro ao criar pasta de favoritos:', error);
      throw error;
    }
  });

  ipcMain.handle('bookmark:get-folders', async (_e, parentId?: string): Promise<BookmarkFolder[]> => {
    try {
      // Validate input parameter
      if (parentId !== undefined && typeof parentId !== 'string') {
        throw new Error('ID da pasta pai inválido');
      }

      return getBookmarkFolders(parentId);
    } catch (error: unknown) {
      console.error('Erro ao buscar pastas de favoritos:', error);
      return [];
    }
  });

  // Download handlers
  ipcMain.handle('download:show-in-folder', (_e, filePath: string): void => {
    // Validate input parameter
    if (typeof filePath !== 'string' || !filePath.trim()) {
      console.error('Caminho de arquivo inválido fornecido para download:show-in-folder');
      return;
    }
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle('download:open-file', (_e, filePath: string): void => {
    // Validate input parameter
    if (typeof filePath !== 'string' || !filePath.trim()) {
      console.error('Caminho de arquivo inválido fornecido para download:open-file');
      return;
    }
    shell.openPath(filePath);
  });

  ipcMain.handle('download:open-folder', (): void => {
    const downloadsPath = app.getPath('downloads');
    shell.openPath(downloadsPath);
  });

  // Favorites bar visibility handler
  ipcMain.on('favorites-bar-hidden', (_e, hidden: boolean) => {
    isFavoritesBarHidden = hidden;
    resizeActiveTab();
  });

  // Find bar visibility handler
  ipcMain.on('find-bar-visibility', (_e, visible: boolean) => {
    if (activeTabId) {
      tabFindBarStates.set(activeTabId, visible);
      resizeActiveTab();
    }
  });

  // Favorites bar visibility handler
  ipcMain.on('favorites-bar-visibility', (_e, hidden: boolean) => {
    isFavoritesBarHidden = hidden;
    resizeActiveTab();
  });

  createWindow();

  // Tenta restaurar abas salvas
  try {
    const savedTabs = getTabsFromDatabase();
    if (savedTabs.length > 0) {
      // Restaura as abas salvas
      let activeTabIndex = 0;
      for (let i = 0; i < savedTabs.length; i++) {
        const tab = savedTabs[i];
        createNewTab(tab.url);
        if (tab.active) {
          activeTabIndex = i;
        }
      }
      // Aguarda um pouco para garantir que as abas foram criadas e depois ativa a aba correta
      setTimeout(() => {
        const tabIds = Array.from(tabs.keys());
        if (tabIds.length > 0 && activeTabIndex < tabIds.length) {
          switchToTab(tabIds[activeTabIndex]);
        }
      }, 200);
    } else {
      // Se não houver abas salvas, cria uma nova aba padrão
      createNewTab();
    }
  } catch (error: unknown) {
    console.error('Erro ao restaurar abas salvas:', error);
    // Em caso de erro, cria uma nova aba padrão
    createNewTab();
  }

  // Registrar listener de resize DEPOIS de criar a janela
  if (mainWindow) {
    mainWindow.on('resize', resizeActiveTab);
  }

  // Função auxiliar para lidar com downloads (usada em ambas as sessões)
  const handleDownload = (_event: Electron.Event, item: Electron.DownloadItem) => {
    const id = uuidv4();
    const filename = item.getFilename();
    const totalBytes = item.getTotalBytes();
    const savePath = item.getSavePath();

    // Envia evento para mainWindow (UI principal)
    if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('download-started', { id, filename, totalBytes, savePath });
    }

    // Envia evento para todas as abas (BrowserViews) - especialmente para hera://downloads
    tabs.forEach((view) => {
      if (view.webContents && !view.webContents.isDestroyed()) {
        view.webContents.send('download-started', { id, filename, totalBytes, savePath });
      }
    });

    item.on('updated', (_event, state) => {
      if (state === 'progressing') {
        const receivedBytes = item.getReceivedBytes();
        
        // Envia para mainWindow
        if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('download-progress', { id, receivedBytes, totalBytes, savePath });
        }

        // Envia para todas as abas
        tabs.forEach((view) => {
          if (view.webContents && !view.webContents.isDestroyed()) {
            view.webContents.send('download-progress', { id, receivedBytes, totalBytes, savePath });
          }
        });
      }
    });

    item.on('done', (_event, state) => {
      const path = item.getSavePath();
      
      // Envia para mainWindow
      if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('download-complete', { id, state, savePath: path });
      }

      // Envia para todas as abas
      tabs.forEach((view) => {
        if (view.webContents && !view.webContents.isDestroyed()) {
          view.webContents.send('download-complete', { id, state, savePath: path });
        }
      });
    });
  };

  // Download event listeners - Registra em AMBAS as sessões
  // defaultSession: para downloads de páginas internas (hera://)
  // webSession: para downloads de sites externos (https://)
  session.defaultSession.on('will-download', handleDownload);
  webSession.on('will-download', handleDownload);
}).catch((error: unknown) => {
  console.error('Erro ao inicializar aplicação:', error);
});

// Função para salvar estado das abas
// const saveTabsState = async () => {
//   try {
//     const tabsArray: TabState[] = [];
//     let position = 0;

//     // Percorre todas as abas em ordem
//     for (const [id, _view] of tabs.entries()) {
//       const info = tabInfo.get(id);
//       if (info) {
//         tabsArray.push({
//           id,
//           url: info.url,
//           title: info.title,
//           favicon: info.favicon,
//           position: position++,
//           active: id === activeTabId,
//         });
//       }
//     }

//     saveTabsToDatabase(tabsArray);
//   } catch (error: unknown) {
//     console.error('Erro ao salvar estado das abas:', error);
//   }
// };

app.on('will-quit', () => {
  saveTabsToDatabase(Array.from(tabs.keys()).map((id, index) => {
    const info = tabInfo.get(id);
    return {
      id,
      url: info?.url || '',
      title: info?.title || '',
      favicon: info?.favicon,
      position: index,
      active: id === activeTabId
    };
  }));
  closeDatabase();
});

// Aumenta o limite de listeners para evitar warning
app.setMaxListeners(20);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});