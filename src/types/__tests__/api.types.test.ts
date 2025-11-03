/**
 * Testes de tipo para api.types.ts
 * 
 * Este arquivo contém testes que validam tipos em tempo de compilação.
 * Se houver erros de tipo, a compilação TypeScript falhará.
 * 
 * @remarks
 * Estes testes não são executados em runtime - eles apenas validam
 * que os tipos estão corretos durante a compilação.
 */

import { HeraAPI } from '../api.types';
import { Bookmark, BookmarkFolder, HistoryEntry } from '../database.types';
import { NavigationState } from '../ui.types';

// ============================================================================
// Utility Types para Testes
// ============================================================================

/**
 * Valida que T é exatamente true
 * Se T for false, o TypeScript gerará um erro de compilação
 */
type AssertTrue<T extends true> = T;

/**
 * Verifica se dois tipos são exatamente iguais
 * Retorna true se T e U são idênticos, false caso contrário
 */
type IsExact<T, U> = 
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
    ? true
    : false;

/**
 * Verifica se T é um subtipo de U (T extends U)
 */
type IsAssignable<T, U> = T extends U ? true : false;

// ============================================================================
// Testes de Métodos de Tab
// ============================================================================

// createNewTab deve aceitar parâmetro opcional string e retornar Promise<void>
type TestCreateNewTab_NoParam = AssertTrue<
  IsExact<ReturnType<HeraAPI['createNewTab']>, Promise<void>>
>;

type TestCreateNewTab_WithParam = AssertTrue<
  IsAssignable<(url: string) => Promise<void>, HeraAPI['createNewTab']>
>;

// switchToTab deve aceitar string e retornar Promise<void>
type TestSwitchToTab = AssertTrue<
  IsExact<
    Parameters<HeraAPI['switchToTab']>,
    [id: string]
  >
>;

// closeTab deve aceitar string e retornar Promise<void>
type TestCloseTab = AssertTrue<
  IsExact<
    HeraAPI['closeTab'],
    (id: string) => Promise<void>
  >
>;

// ============================================================================
// Testes de Métodos de Navigation
// ============================================================================

// navigateTo deve aceitar string e retornar Promise<void>
type TestNavigateTo = AssertTrue<
  IsExact<
    HeraAPI['navigateTo'],
    (url: string) => Promise<void>
  >
>;

// navigateBack não deve aceitar parâmetros e retornar Promise<void>
type TestNavigateBack = AssertTrue<
  IsExact<
    HeraAPI['navigateBack'],
    () => Promise<void>
  >
>;

// navigateForward não deve aceitar parâmetros e retornar Promise<void>
type TestNavigateForward = AssertTrue<
  IsExact<
    HeraAPI['navigateForward'],
    () => Promise<void>
  >
>;

// navigateReload não deve aceitar parâmetros e retornar Promise<void>
type TestNavigateReload = AssertTrue<
  IsExact<
    HeraAPI['navigateReload'],
    () => Promise<void>
  >
>;

// getNavigationState deve retornar Promise<NavigationState>
type TestGetNavigationState = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['getNavigationState']>,
    Promise<NavigationState>
  >
>;

// ============================================================================
// Testes de Métodos de Window
// ============================================================================

// windowMinimize não deve aceitar parâmetros e retornar Promise<void>
type TestWindowMinimize = AssertTrue<
  IsExact<
    HeraAPI['windowMinimize'],
    () => Promise<void>
  >
>;

// windowMaximize não deve aceitar parâmetros e retornar Promise<void>
type TestWindowMaximize = AssertTrue<
  IsExact<
    HeraAPI['windowMaximize'],
    () => Promise<void>
  >
>;

// windowClose não deve aceitar parâmetros e retornar Promise<void>
type TestWindowClose = AssertTrue<
  IsExact<
    HeraAPI['windowClose'],
    () => Promise<void>
  >
>;

// ============================================================================
// Testes de Métodos de Download
// ============================================================================

// showItemInFolder deve aceitar string e retornar Promise<void>
type TestShowItemInFolder = AssertTrue<
  IsExact<
    HeraAPI['showItemInFolder'],
    (path: string) => Promise<void>
  >
>;

// openFile deve aceitar string e retornar Promise<void>
type TestOpenFile = AssertTrue<
  IsExact<
    HeraAPI['openFile'],
    (path: string) => Promise<void>
  >
>;

// ============================================================================
// Testes de Métodos de History
// ============================================================================

// getHistory deve retornar Promise<HistoryEntry[]>
type TestGetHistory = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['getHistory']>,
    Promise<HistoryEntry[]>
  >
>;

// clearHistory não deve aceitar parâmetros e retornar Promise<void>
type TestClearHistory = AssertTrue<
  IsExact<
    HeraAPI['clearHistory'],
    () => Promise<void>
  >
>;

// ============================================================================
// Testes de Métodos de Bookmark (CRÍTICOS)
// ============================================================================

// addBookmark deve aceitar parâmetros corretos e retornar Promise<Bookmark>
type TestAddBookmark_ReturnType = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['addBookmark']>,
    Promise<Bookmark>
  >
>;

type TestAddBookmark_Parameters = AssertTrue<
  IsExact<
    Parameters<HeraAPI['addBookmark']>,
    [url: string, title: string, favicon?: string, folderId?: string]
  >
>;

// removeBookmark deve aceitar string e retornar Promise<boolean>
type TestRemoveBookmark = AssertTrue<
  IsExact<
    HeraAPI['removeBookmark'],
    (id: string) => Promise<boolean>
  >
>;

// getBookmarks deve aceitar parâmetro opcional e retornar Promise<Bookmark[]>
type TestGetBookmarks_ReturnType = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['getBookmarks']>,
    Promise<Bookmark[]>
  >
>;

type TestGetBookmarks_Parameters = AssertTrue<
  IsExact<
    Parameters<HeraAPI['getBookmarks']>,
    [folderId?: string]
  >
>;

// searchBookmarks deve aceitar string e retornar Promise<Bookmark[]>
type TestSearchBookmarks = AssertTrue<
  IsExact<
    HeraAPI['searchBookmarks'],
    (query: string) => Promise<Bookmark[]>
  >
>;

// createBookmarkFolder deve aceitar parâmetros corretos e retornar Promise<BookmarkFolder>
type TestCreateBookmarkFolder_ReturnType = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['createBookmarkFolder']>,
    Promise<BookmarkFolder>
  >
>;

type TestCreateBookmarkFolder_Parameters = AssertTrue<
  IsExact<
    Parameters<HeraAPI['createBookmarkFolder']>,
    [name: string, parentId?: string]
  >
>;

// getBookmarkFolders deve aceitar parâmetro opcional e retornar Promise<BookmarkFolder[]>
type TestGetBookmarkFolders_ReturnType = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['getBookmarkFolders']>,
    Promise<BookmarkFolder[]>
  >
>;

type TestGetBookmarkFolders_Parameters = AssertTrue<
  IsExact<
    Parameters<HeraAPI['getBookmarkFolders']>,
    [parentId?: string]
  >
>;

// ============================================================================
// Testes de Métodos de Settings
// ============================================================================

// getSetting deve aceitar string e retornar Promise<string | null>
type TestGetSetting = AssertTrue<
  IsExact<
    HeraAPI['getSetting'],
    (key: string) => Promise<string | null>
  >
>;

// setSetting deve aceitar dois strings e retornar Promise<boolean>
type TestSetSetting = AssertTrue<
  IsExact<
    HeraAPI['setSetting'],
    (key: string, value: string) => Promise<boolean>
  >
>;

// getAllSettings deve retornar Promise<Record<string, string>>
type TestGetAllSettings = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['getAllSettings']>,
    Promise<Record<string, string>>
  >
>;

// ============================================================================
// Testes de Métodos de View
// ============================================================================

// toggleMenu não deve aceitar parâmetros e retornar void (não Promise)
type TestToggleMenu = AssertTrue<
  IsExact<
    HeraAPI['toggleMenu'],
    () => void
  >
>;

// menuAction deve aceitar string e retornar void (não Promise)
type TestMenuAction = AssertTrue<
  IsExact<
    HeraAPI['menuAction'],
    (action: string) => void
  >
>;

// ============================================================================
// Testes de Event Listeners
// ============================================================================

// onTabCreated deve aceitar callback e retornar void
type TestOnTabCreated = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['onTabCreated']>,
    void
  >
>;

// onTabSwitched deve aceitar callback e retornar void
type TestOnTabSwitched = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['onTabSwitched']>,
    void
  >
>;

// onTabUpdated deve aceitar callback e retornar void
type TestOnTabUpdated = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['onTabUpdated']>,
    void
  >
>;

// onTabClosed deve aceitar callback e retornar void
type TestOnTabClosed = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['onTabClosed']>,
    void
  >
>;

// onTabLoading deve aceitar callback e retornar void
type TestOnTabLoading = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['onTabLoading']>,
    void
  >
>;

// on deve aceitar string e callback genérico e retornar void
type TestOn = AssertTrue<
  IsExact<
    Parameters<HeraAPI['on']>[0],
    string
  >
>;

// ============================================================================
// Teste de Declaração Global Window
// ============================================================================

// Window.heraAPI deve ser do tipo HeraAPI
type TestWindowHeraAPI = AssertTrue<
  IsExact<
    Window['heraAPI'],
    HeraAPI
  >
>;

// ============================================================================
// Testes de Compatibilidade de Assinatura
// ============================================================================

/**
 * Valida que a interface HeraAPI pode ser implementada corretamente
 * Este teste garante que não há conflitos de tipo na interface
 */
type TestHeraAPIImplementable = AssertTrue<
  IsAssignable<
    {
      createNewTab: (url?: string) => Promise<void>;
      getBookmarks: (folderId?: string) => Promise<Bookmark[]>;
      addBookmark: (url: string, title: string, favicon?: string, folderId?: string) => Promise<Bookmark>;
    },
    Pick<HeraAPI, 'createNewTab' | 'getBookmarks' | 'addBookmark'>
  >
>;

// ============================================================================
// Exportação de Tipos de Teste (para referência)
// ============================================================================

/**
 * Tipo de teste que valida todos os métodos críticos da API
 * Pode ser usado para garantir que mudanças futuras não quebrem a API
 */
export type CriticalAPIMethods = Pick<
  HeraAPI,
  | 'createNewTab'
  | 'navigateTo'
  | 'getHistory'
  | 'addBookmark'
  | 'removeBookmark'
  | 'getBookmarks'
  | 'searchBookmarks'
  | 'createBookmarkFolder'
  | 'getBookmarkFolders'
>;

/**
 * Valida que todos os métodos críticos estão presentes
 */
type TestCriticalMethodsPresent = AssertTrue<
  IsAssignable<CriticalAPIMethods, HeraAPI>
>;

// Se este arquivo compila sem erros, todos os testes de tipo passaram! ✓
