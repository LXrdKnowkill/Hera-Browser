import type { NavigationState } from './ui.types';
import { Bookmark, BookmarkFolder, HistoryEntry } from './database.types';
import {
  TabCreatedCallback,
  TabSwitchedCallback,
  TabUpdatedCallback,
  TabClosedCallback,
  TabLoadingCallback,
  UIVisibilityCallback,
  WindowMaximizedCallback,
  GenericCallback,
  DownloadStartedCallback,
  DownloadProgressCallback,
  DownloadCompleteCallback
} from './ipc.types';

/**
 * Interface principal da API exposta ao renderer via contextBridge
 * 
 * Esta interface define todos os métodos e eventos disponíveis para o processo renderer
 * através do Electron's contextBridge. Ela fornece uma API segura e tipada para
 * interação entre o renderer e o main process.
 * 
 * @example
 * ```typescript
 * // Criar uma nova aba
 * await window.heraAPI.createNewTab('https://example.com');
 * 
 * // Adicionar um bookmark
 * const bookmark = await window.heraAPI.addBookmark(
 *   'https://example.com',
 *   'Example Site',
 *   'data:image/png;base64,...'
 * );
 * 
 * // Escutar eventos de aba
 * window.heraAPI.onTabCreated((tabInfo) => {
 *   console.log('Nova aba criada:', tabInfo);
 * });
 * ```
 */
export interface HeraAPI {
  // Tab Actions
  
  /**
   * Cria uma nova aba no navegador
   * 
   * @param url - URL opcional para carregar na nova aba. Se omitido, abre uma aba em branco
   * @returns Promise que resolve quando a aba é criada
   * 
   * @example
   * ```typescript
   * await window.heraAPI.createNewTab('https://google.com');
   * await window.heraAPI.createNewTab(); // Aba em branco
   * ```
   */
  createNewTab: (url?: string) => Promise<void>;
  
  /**
   * Alterna para uma aba específica
   * 
   * @param id - ID único da aba para alternar
   * @returns Promise que resolve quando a aba é ativada
   */
  switchToTab: (id: string) => Promise<void>;
  
  /**
   * Fecha uma aba específica
   * 
   * @param id - ID único da aba a ser fechada
   * @returns Promise que resolve quando a aba é fechada
   */
  closeTab: (id: string) => Promise<void>;

  // Navigation Actions
  
  /**
   * Navega para uma URL específica na aba ativa
   * 
   * @param url - URL completa para navegar (deve incluir protocolo)
   * @returns Promise que resolve quando a navegação é iniciada
   * 
   * @example
   * ```typescript
   * await window.heraAPI.navigateTo('https://example.com');
   * ```
   */
  navigateTo: (url: string) => Promise<void>;
  
  /**
   * Navega para a página anterior no histórico da aba ativa
   * 
   * @returns Promise que resolve quando a navegação é iniciada
   */
  navigateBack: () => Promise<void>;
  
  /**
   * Navega para a próxima página no histórico da aba ativa
   * 
   * @returns Promise que resolve quando a navegação é iniciada
   */
  navigateForward: () => Promise<void>;
  
  /**
   * Recarrega a página atual da aba ativa
   * 
   * @returns Promise que resolve quando o reload é iniciado
   */
  navigateReload: () => Promise<void>;
  
  /**
   * Obtém o estado de navegação atual (disponibilidade de back/forward)
   * 
   * @returns Promise com o estado de navegação da aba ativa
   */
  getNavigationState: () => Promise<NavigationState>;

  // Window Actions
  
  /**
   * Minimiza a janela do navegador
   * 
   * @returns Promise que resolve quando a janela é minimizada
   */
  windowMinimize: () => Promise<void>;
  
  /**
   * Maximiza ou restaura a janela do navegador
   * 
   * @returns Promise que resolve quando a janela muda de estado
   */
  windowMaximize: () => Promise<void>;
  
  /**
   * Fecha a janela do navegador
   * 
   * @returns Promise que resolve quando a janela é fechada
   */
  windowClose: () => Promise<void>;

  // Download Actions
  
  /**
   * Abre o explorador de arquivos mostrando o item especificado
   * 
   * @param path - Caminho completo do arquivo ou pasta
   * @returns Promise que resolve quando o explorador é aberto
   */
  showItemInFolder: (path: string) => Promise<void>;
  
  /**
   * Abre um arquivo com o aplicativo padrão do sistema
   * 
   * @param path - Caminho completo do arquivo
   * @returns Promise que resolve quando o arquivo é aberto
   */
  openFile: (path: string) => Promise<void>;

  // History Actions
  
  /**
   * Obtém todo o histórico de navegação
   * 
   * @returns Promise com array de entradas de histórico, ordenadas por timestamp
   */
  getHistory: () => Promise<HistoryEntry[]>;
  
  /**
   * Limpa todo o histórico de navegação
   * 
   * @returns Promise que resolve quando o histórico é limpo
   */
  clearHistory: () => Promise<void>;

  // Bookmark Actions
  
  /**
   * Adiciona um novo bookmark
   * 
   * @param url - URL do site a ser favoritado
   * @param title - Título do bookmark
   * @param favicon - URL do favicon em base64 ou caminho (opcional)
   * @param folderId - ID da pasta onde adicionar o bookmark (opcional, null = raiz)
   * @returns Promise com o bookmark criado, incluindo ID gerado
   * 
   * @example
   * ```typescript
   * const bookmark = await window.heraAPI.addBookmark(
   *   'https://github.com',
   *   'GitHub',
   *   'data:image/png;base64,...',
   *   'folder-uuid'
   * );
   * console.log('Bookmark criado com ID:', bookmark.id);
   * ```
   */
  addBookmark: (url: string, title: string, favicon?: string, folderId?: string) => Promise<Bookmark>;
  
  /**
   * Remove um bookmark existente
   * 
   * @param id - ID único do bookmark a ser removido
   * @returns Promise com true se removido com sucesso, false caso contrário
   */
  removeBookmark: (id: string) => Promise<boolean>;
  
  /**
   * Obtém bookmarks de uma pasta específica ou da raiz
   * 
   * @param folderId - ID da pasta (opcional, omitir para obter bookmarks da raiz)
   * @returns Promise com array de bookmarks da pasta especificada
   * 
   * @example
   * ```typescript
   * const rootBookmarks = await window.heraAPI.getBookmarks();
   * const folderBookmarks = await window.heraAPI.getBookmarks('folder-uuid');
   * ```
   */
  getBookmarks: (folderId?: string) => Promise<Bookmark[]>;
  
  /**
   * Busca bookmarks por título ou URL
   * 
   * @param query - Texto de busca (case-insensitive)
   * @returns Promise com array de bookmarks que correspondem à busca
   * 
   * @example
   * ```typescript
   * const results = await window.heraAPI.searchBookmarks('github');
   * ```
   */
  searchBookmarks: (query: string) => Promise<Bookmark[]>;
  
  /**
   * Cria uma nova pasta de bookmarks
   * 
   * @param name - Nome da pasta
   * @param parentId - ID da pasta pai (opcional, null = raiz)
   * @returns Promise com a pasta criada, incluindo ID gerado
   * 
   * @example
   * ```typescript
   * const folder = await window.heraAPI.createBookmarkFolder('Trabalho');
   * const subfolder = await window.heraAPI.createBookmarkFolder('Projetos', folder.id);
   * ```
   */
  createBookmarkFolder: (name: string, parentId?: string) => Promise<BookmarkFolder>;
  
  /**
   * Obtém pastas de bookmarks de um nível específico
   * 
   * @param parentId - ID da pasta pai (opcional, omitir para obter pastas da raiz)
   * @returns Promise com array de pastas do nível especificado
   */
  getBookmarkFolders: (parentId?: string) => Promise<BookmarkFolder[]>;

  // Settings Actions
  
  /**
   * Obtém o valor de uma configuração específica
   * 
   * @param key - Chave da configuração
   * @returns Promise com o valor da configuração ou null se não existir
   */
  getSetting: (key: string) => Promise<string | null>;
  
  /**
   * Define o valor de uma configuração
   * 
   * @param key - Chave da configuração
   * @param value - Valor a ser salvo
   * @returns Promise com true se salvo com sucesso, false caso contrário
   */
  setSetting: (key: string, value: string) => Promise<boolean>;
  
  /**
   * Obtém todas as configurações
   * 
   * @returns Promise com objeto contendo todas as configurações (chave-valor)
   */
  getAllSettings: () => Promise<Record<string, string>>;

  // View Actions
  
  /**
   * Alterna a visibilidade do menu
   */
  toggleMenu: () => void;
  
  /**
   * Esconde temporariamente o conteúdo da aba (BrowserView)
   * Útil para mostrar overlays como omnibox
   */
  hideContent: () => void;
  
  /**
   * Mostra novamente o conteúdo da aba (BrowserView)
   */
  showContent: () => void;
  
  /**
   * Executa uma ação do menu
   * 
   * @param action - Nome da ação a ser executada
   */
  menuAction: (action: string) => void;
  
  // Event Listeners
  
  /**
   * Registra callback para evento de aba criada
   * 
   * @param callback - Função a ser chamada quando uma aba é criada
   * 
   * @example
   * ```typescript
   * window.heraAPI.onTabCreated((tabInfo) => {
   *   console.log('Nova aba:', tabInfo.title);
   * });
   * ```
   */
  onTabCreated: (callback: TabCreatedCallback) => void;
  
  /**
   * Registra callback para evento de troca de aba
   * 
   * @param callback - Função a ser chamada quando a aba ativa muda
   */
  onTabSwitched: (callback: TabSwitchedCallback) => void;
  
  /**
   * Registra callback para evento de atualização de aba
   * 
   * @param callback - Função a ser chamada quando uma aba é atualizada
   */
  onTabUpdated: (callback: TabUpdatedCallback) => void;
  
  /**
   * Registra callback para evento de aba fechada
   * 
   * @param callback - Função a ser chamada quando uma aba é fechada
   */
  onTabClosed: (callback: TabClosedCallback) => void;
  
  /**
   * Registra callback para evento de loading de aba
   * 
   * @param callback - Função a ser chamada quando o estado de loading muda
   */
  onTabLoading: (callback: TabLoadingCallback) => void;
  
  /**
   * Registra callback para evento de visibilidade da UI
   * 
   * @param callback - Função a ser chamada quando a visibilidade da UI muda
   */
  onSetUIVisibility: (callback: UIVisibilityCallback) => void;
  
  /**
   * Registra callback para evento de status de maximização da janela
   * 
   * @param callback - Função a ser chamada quando a janela é maximizada/restaurada
   */
  onWindowMaximizedStatus: (callback: WindowMaximizedCallback) => void;
  
  /**
   * Registra callback genérico para eventos IPC customizados
   * 
   * @param channel - Nome do canal IPC
   * @param callback - Função a ser chamada quando o evento é disparado
   */
  on: (channel: string, callback: GenericCallback) => void;
  
  /**
   * Envia uma mensagem para o processo principal
   * 
   * @param channel - Nome do canal IPC
   * @param args - Argumentos a serem enviados
   */
  send: (channel: string, ...args: unknown[]) => void;
  
  /**
   * Registra callback para evento de download iniciado
   * 
   * @param callback - Função a ser chamada quando um download é iniciado
   */
  onDownloadStarted: (callback: DownloadStartedCallback) => void;
  
  /**
   * Registra callback para evento de progresso de download
   * 
   * @param callback - Função a ser chamada quando o progresso de download é atualizado
   */
  onDownloadProgress: (callback: DownloadProgressCallback) => void;
  
  /**
   * Registra callback para evento de download completo
   * 
   * @param callback - Função a ser chamada quando um download é concluído
   */
  onDownloadComplete: (callback: DownloadCompleteCallback) => void;

  // Download Actions
  
  /**
   * Abre um arquivo baixado
   * 
   * @param filePath - Caminho completo do arquivo
   * @returns Promise que resolve quando o arquivo é aberto
   */
  openDownloadedFile: (filePath: string) => Promise<void>;
  
  /**
   * Mostra um arquivo baixado na pasta do sistema
   * 
   * @param filePath - Caminho completo do arquivo
   * @returns Promise que resolve quando a pasta é aberta
   */
  showDownloadInFolder: (filePath: string) => Promise<void>;
  
  /**
   * Obtém todos os downloads do banco de dados
   * 
   * @returns Promise com array de downloads
   */
  getDownloads: () => Promise<unknown[]>;
  
  /**
   * Remove downloads concluídos do banco de dados
   * 
   * @returns Promise que resolve quando os downloads são removidos
   */
  clearCompletedDownloads: () => Promise<void>;
  
  /**
   * Remove um download específico do banco de dados
   * 
   * @param id - ID do download a ser removido
   * @returns Promise com boolean indicando sucesso
   */
  removeDownload: (id: string) => Promise<boolean>;
  
  /**
   * Abre a pasta de downloads padrão do sistema
   * 
   * @returns Promise que resolve quando a pasta é aberta
   */
  openDownloadsFolder: () => Promise<void>;
}

/**
 * Declaração global para Window com heraAPI
 */
declare global {
  interface Window {
    heraAPI: HeraAPI;
  }
}
