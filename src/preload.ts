// External dependencies
/**
 * PRELOAD PRIVILEGIADO (UI)
 * 
 * Este preload expõe a HeraAPI completa e só deve ser usado em:
 * - mainWindow (UI do navegador)
 * - Páginas internas (hera://settings, hera://history, hera://downloads, etc.)
 * 
 * ⚠️ NUNCA use este preload em sites externos!
 */

import { contextBridge, ipcRenderer } from 'electron';

// Types
import type {
  HeraAPI,
  Bookmark,
  BookmarkFolder,
  HistoryEntry,
  NavigationState,
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
} from './types';

const heraAPI: HeraAPI = {
  // Tab Actions
  createNewTab: (url?: string): Promise<void> => ipcRenderer.invoke('tab:new', url),
  switchToTab: (id: string): Promise<void> => ipcRenderer.invoke('tab:switch', id),
  closeTab: (id: string): Promise<void> => ipcRenderer.invoke('tab:close', id),

  // Navigation Actions
  navigateTo: (url: string): Promise<void> => ipcRenderer.invoke('nav:to', url),
  navigateBack: (): Promise<void> => ipcRenderer.invoke('nav:back'),
  navigateForward: (): Promise<void> => ipcRenderer.invoke('nav:forward'),
  navigateReload: (): Promise<void> => ipcRenderer.invoke('nav:reload'),
  getNavigationState: (): Promise<NavigationState> => ipcRenderer.invoke('nav:get-state'),

  // Window Actions
  windowMinimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  windowMaximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
  windowClose: (): Promise<void> => ipcRenderer.invoke('window:close'),

  // History Actions
  getHistory: (): Promise<HistoryEntry[]> => ipcRenderer.invoke('history:get'),
  clearHistory: (): Promise<void> => ipcRenderer.invoke('history:clear'),

  // Bookmark Actions
  addBookmark: (url: string, title: string, favicon?: string, folderId?: string): Promise<Bookmark> => ipcRenderer.invoke('bookmark:add', url, title, favicon, folderId),
  removeBookmark: (id: string): Promise<boolean> => ipcRenderer.invoke('bookmark:remove', id),
  getBookmarks: (folderId?: string): Promise<Bookmark[]> => ipcRenderer.invoke('bookmark:get', folderId),
  searchBookmarks: (query: string): Promise<Bookmark[]> => ipcRenderer.invoke('bookmark:search', query),
  createBookmarkFolder: (name: string, parentId?: string): Promise<BookmarkFolder> => ipcRenderer.invoke('bookmark:create-folder', name, parentId),
  getBookmarkFolders: (parentId?: string): Promise<BookmarkFolder[]> => ipcRenderer.invoke('bookmark:get-folders', parentId),

  // Settings Actions
  getSetting: (key: string): Promise<string | null> => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string): Promise<boolean> => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: (): Promise<Record<string, string>> => ipcRenderer.invoke('settings:getAll'),

  // Download Actions
  showItemInFolder: (path: string): Promise<void> => ipcRenderer.invoke('download:show-in-folder', path),
  openFile: (path: string): Promise<void> => ipcRenderer.invoke('download:open-file', path),
  getDownloads: (): Promise<unknown[]> => ipcRenderer.invoke('downloads:get'),
  clearCompletedDownloads: (): Promise<void> => ipcRenderer.invoke('downloads:clear-completed'),
  removeDownload: (id: string): Promise<boolean> => ipcRenderer.invoke('downloads:remove', id),

  // View Actions
  toggleMenu: () => {
    ipcRenderer.send('menu:toggle');
  },
  menuAction: (action: string) => ipcRenderer.send('menu:action', action),

  // Listeners from Main Process
  onTabCreated: (callback: TabCreatedCallback) => {
    ipcRenderer.on('tab-created', (_, tabInfo) => callback(tabInfo));
  },
  onTabSwitched: (callback: TabSwitchedCallback) => {
    ipcRenderer.on('tab-switched', (_, id, url) => callback(id, url));
  },
  onTabUpdated: (callback: TabUpdatedCallback) => {
    ipcRenderer.on('tab-updated', (_, id, tabInfo) => callback(id, tabInfo));
  },
  onTabClosed: (callback: TabClosedCallback) => {
    ipcRenderer.on('tab-closed', (_, id) => callback(id));
  },
  onTabLoading: (callback: TabLoadingCallback) => {
    ipcRenderer.on('tab-loading', (_, id, isLoading) => callback(id, isLoading));
  },
  onSetUIVisibility: (callback: UIVisibilityCallback) => {
    ipcRenderer.on('set-ui-visibility', (_, visible) => callback(visible));
  },
  onWindowMaximizedStatus: (callback: WindowMaximizedCallback) => {
    ipcRenderer.on('window:maximized-status', (_, isMaximized) => callback(isMaximized));
  },
  on: (channel: string, callback: GenericCallback) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  send: (channel: string, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args);
  },
  hideContent: () => ipcRenderer.send('ui:hide-content'),
  showContent: () => ipcRenderer.send('ui:show-content'),
  onDownloadStarted: (callback: DownloadStartedCallback) => {
    ipcRenderer.on('download-started', (_, data) => callback(data));
  },
  onDownloadProgress: (callback: DownloadProgressCallback) => {
    ipcRenderer.on('download-progress', (_, data) => callback(data));
  },
  onDownloadComplete: (callback: DownloadCompleteCallback) => {
    ipcRenderer.on('download-complete', (_, data) => callback(data));
  },

  // Download Actions
  openDownloadedFile: (filePath: string): Promise<void> => ipcRenderer.invoke('download:open-file', filePath),
  showDownloadInFolder: (filePath: string): Promise<void> => ipcRenderer.invoke('download:show-in-folder', filePath),
  openDownloadsFolder: (): Promise<void> => ipcRenderer.invoke('download:open-folder'),
};

contextBridge.exposeInMainWorld('heraAPI', heraAPI);