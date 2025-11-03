/**
 * Testes de tipo para database.types.ts
 * 
 * Este arquivo contém testes que validam tipos em tempo de compilação.
 * Se houver erros de tipo, a compilação TypeScript falhará.
 * 
 * @remarks
 * Estes testes não são executados em runtime - eles apenas validam
 * que os tipos estão corretos durante a compilação.
 */

import { 
  HistoryEntry, 
  Bookmark, 
  BookmarkFolder, 
  TabState 
} from '../database.types';

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

/**
 * Verifica se uma propriedade é opcional em um tipo
 */
type IsOptional<T, K extends keyof T> = undefined extends T[K] ? true : false;

/**
 * Verifica se uma propriedade é obrigatória em um tipo
 */
type IsRequired<T, K extends keyof T> = undefined extends T[K] ? false : true;

// ============================================================================
// Testes de Interface HistoryEntry
// ============================================================================

// Valida que HistoryEntry tem todas as propriedades esperadas
type TestHistoryEntry_HasAllProperties = AssertTrue<
  IsExact<
    keyof HistoryEntry,
    'id' | 'url' | 'title' | 'timestamp' | 'visit_count'
  >
>;

// Valida tipos de cada propriedade
type TestHistoryEntry_IdType = AssertTrue<
  IsExact<HistoryEntry['id'], number | undefined>
>;

type TestHistoryEntry_UrlType = AssertTrue<
  IsExact<HistoryEntry['url'], string>
>;

type TestHistoryEntry_TitleType = AssertTrue<
  IsExact<HistoryEntry['title'], string>
>;

type TestHistoryEntry_TimestampType = AssertTrue<
  IsExact<HistoryEntry['timestamp'], number>
>;

type TestHistoryEntry_VisitCountType = AssertTrue<
  IsExact<HistoryEntry['visit_count'], number | undefined>
>;

// Valida que propriedades opcionais estão corretas
type TestHistoryEntry_IdIsOptional = AssertTrue<
  IsOptional<HistoryEntry, 'id'>
>;

type TestHistoryEntry_VisitCountIsOptional = AssertTrue<
  IsOptional<HistoryEntry, 'visit_count'>
>;

// Valida que propriedades obrigatórias estão corretas
type TestHistoryEntry_UrlIsRequired = AssertTrue<
  IsRequired<HistoryEntry, 'url'>
>;

type TestHistoryEntry_TitleIsRequired = AssertTrue<
  IsRequired<HistoryEntry, 'title'>
>;

type TestHistoryEntry_TimestampIsRequired = AssertTrue<
  IsRequired<HistoryEntry, 'timestamp'>
>;

// Valida que HistoryEntry pode ser criada com campos mínimos
type TestHistoryEntry_MinimalCreation = AssertTrue<
  IsAssignable<
    { url: string; title: string; timestamp: number },
    HistoryEntry
  >
>;

// Valida que HistoryEntry pode ser criada com todos os campos
type TestHistoryEntry_FullCreation = AssertTrue<
  IsAssignable<
    { id: number; url: string; title: string; timestamp: number; visit_count: number },
    HistoryEntry
  >
>;

// ============================================================================
// Testes de Interface Bookmark
// ============================================================================

// Valida que Bookmark tem todas as propriedades esperadas
type TestBookmark_HasAllProperties = AssertTrue<
  IsExact<
    keyof Bookmark,
    'id' | 'url' | 'title' | 'favicon' | 'folder_id' | 'position' | 'created_at' | 'updated_at'
  >
>;

// Valida tipos de cada propriedade
type TestBookmark_IdType = AssertTrue<
  IsExact<Bookmark['id'], string>
>;

type TestBookmark_UrlType = AssertTrue<
  IsExact<Bookmark['url'], string | undefined>
>;

type TestBookmark_TitleType = AssertTrue<
  IsExact<Bookmark['title'], string>
>;

type TestBookmark_FaviconType = AssertTrue<
  IsExact<Bookmark['favicon'], string | undefined>
>;

type TestBookmark_FolderIdType = AssertTrue<
  IsExact<Bookmark['folder_id'], string | undefined>
>;

type TestBookmark_PositionType = AssertTrue<
  IsExact<Bookmark['position'], number>
>;

type TestBookmark_CreatedAtType = AssertTrue<
  IsExact<Bookmark['created_at'], number>
>;

type TestBookmark_UpdatedAtType = AssertTrue<
  IsExact<Bookmark['updated_at'], number>
>;

// Valida que propriedades opcionais estão corretas
type TestBookmark_UrlIsOptional = AssertTrue<
  IsOptional<Bookmark, 'url'>
>;

type TestBookmark_FaviconIsOptional = AssertTrue<
  IsOptional<Bookmark, 'favicon'>
>;

type TestBookmark_FolderIdIsOptional = AssertTrue<
  IsOptional<Bookmark, 'folder_id'>
>;

// Valida que propriedades obrigatórias estão corretas
type TestBookmark_IdIsRequired = AssertTrue<
  IsRequired<Bookmark, 'id'>
>;

type TestBookmark_TitleIsRequired = AssertTrue<
  IsRequired<Bookmark, 'title'>
>;

type TestBookmark_PositionIsRequired = AssertTrue<
  IsRequired<Bookmark, 'position'>
>;

type TestBookmark_CreatedAtIsRequired = AssertTrue<
  IsRequired<Bookmark, 'created_at'>
>;

type TestBookmark_UpdatedAtIsRequired = AssertTrue<
  IsRequired<Bookmark, 'updated_at'>
>;

// Valida que Bookmark pode ser criado com campos mínimos
type TestBookmark_MinimalCreation = AssertTrue<
  IsAssignable<
    { 
      id: string; 
      title: string; 
      position: number; 
      created_at: number; 
      updated_at: number 
    },
    Bookmark
  >
>;

// Valida que Bookmark pode ser criado com todos os campos
type TestBookmark_FullCreation = AssertTrue<
  IsAssignable<
    { 
      id: string; 
      url: string;
      title: string; 
      favicon: string;
      folder_id: string;
      position: number; 
      created_at: number; 
      updated_at: number 
    },
    Bookmark
  >
>;

// Valida que Bookmark pode ser um separador (sem URL)
type TestBookmark_SeparatorCreation = AssertTrue<
  IsAssignable<
    { 
      id: string; 
      title: string; 
      position: number; 
      created_at: number; 
      updated_at: number 
    },
    Bookmark
  >
>;

// ============================================================================
// Testes de Interface BookmarkFolder
// ============================================================================

// Valida que BookmarkFolder tem todas as propriedades esperadas
type TestBookmarkFolder_HasAllProperties = AssertTrue<
  IsExact<
    keyof BookmarkFolder,
    'id' | 'name' | 'parent_id' | 'position' | 'created_at'
  >
>;

// Valida tipos de cada propriedade
type TestBookmarkFolder_IdType = AssertTrue<
  IsExact<BookmarkFolder['id'], string>
>;

type TestBookmarkFolder_NameType = AssertTrue<
  IsExact<BookmarkFolder['name'], string>
>;

type TestBookmarkFolder_ParentIdType = AssertTrue<
  IsExact<BookmarkFolder['parent_id'], string | undefined>
>;

type TestBookmarkFolder_PositionType = AssertTrue<
  IsExact<BookmarkFolder['position'], number>
>;

type TestBookmarkFolder_CreatedAtType = AssertTrue<
  IsExact<BookmarkFolder['created_at'], number>
>;

// Valida que propriedades opcionais estão corretas
type TestBookmarkFolder_ParentIdIsOptional = AssertTrue<
  IsOptional<BookmarkFolder, 'parent_id'>
>;

// Valida que propriedades obrigatórias estão corretas
type TestBookmarkFolder_IdIsRequired = AssertTrue<
  IsRequired<BookmarkFolder, 'id'>
>;

type TestBookmarkFolder_NameIsRequired = AssertTrue<
  IsRequired<BookmarkFolder, 'name'>
>;

type TestBookmarkFolder_PositionIsRequired = AssertTrue<
  IsRequired<BookmarkFolder, 'position'>
>;

type TestBookmarkFolder_CreatedAtIsRequired = AssertTrue<
  IsRequired<BookmarkFolder, 'created_at'>
>;

// Valida que BookmarkFolder pode ser criada com campos mínimos (pasta raiz)
type TestBookmarkFolder_RootFolderCreation = AssertTrue<
  IsAssignable<
    { 
      id: string; 
      name: string; 
      position: number; 
      created_at: number 
    },
    BookmarkFolder
  >
>;

// Valida que BookmarkFolder pode ser criada com parent_id (subpasta)
type TestBookmarkFolder_SubFolderCreation = AssertTrue<
  IsAssignable<
    { 
      id: string; 
      name: string; 
      parent_id: string;
      position: number; 
      created_at: number 
    },
    BookmarkFolder
  >
>;

// ============================================================================
// Testes de Interface TabState
// ============================================================================

// Valida que TabState tem todas as propriedades esperadas
type TestTabState_HasAllProperties = AssertTrue<
  IsExact<
    keyof TabState,
    'id' | 'url' | 'title' | 'favicon' | 'position' | 'active'
  >
>;

// Valida tipos de cada propriedade
type TestTabState_IdType = AssertTrue<
  IsExact<TabState['id'], string>
>;

type TestTabState_UrlType = AssertTrue<
  IsExact<TabState['url'], string>
>;

type TestTabState_TitleType = AssertTrue<
  IsExact<TabState['title'], string>
>;

type TestTabState_FaviconType = AssertTrue<
  IsExact<TabState['favicon'], string | undefined>
>;

type TestTabState_PositionType = AssertTrue<
  IsExact<TabState['position'], number>
>;

type TestTabState_ActiveType = AssertTrue<
  IsExact<TabState['active'], boolean>
>;

// Valida que propriedades opcionais estão corretas
type TestTabState_FaviconIsOptional = AssertTrue<
  IsOptional<TabState, 'favicon'>
>;

// Valida que propriedades obrigatórias estão corretas
type TestTabState_IdIsRequired = AssertTrue<
  IsRequired<TabState, 'id'>
>;

type TestTabState_UrlIsRequired = AssertTrue<
  IsRequired<TabState, 'url'>
>;

type TestTabState_TitleIsRequired = AssertTrue<
  IsRequired<TabState, 'title'>
>;

type TestTabState_PositionIsRequired = AssertTrue<
  IsRequired<TabState, 'position'>
>;

type TestTabState_ActiveIsRequired = AssertTrue<
  IsRequired<TabState, 'active'>
>;

// Valida que TabState pode ser criado com campos mínimos
type TestTabState_MinimalCreation = AssertTrue<
  IsAssignable<
    { 
      id: string; 
      url: string; 
      title: string; 
      position: number; 
      active: boolean 
    },
    TabState
  >
>;

// Valida que TabState pode ser criado com todos os campos
type TestTabState_FullCreation = AssertTrue<
  IsAssignable<
    { 
      id: string; 
      url: string; 
      title: string; 
      favicon: string;
      position: number; 
      active: boolean 
    },
    TabState
  >
>;

// ============================================================================
// Testes de Relacionamentos entre Tipos
// ============================================================================

// Valida que Bookmark.folder_id é compatível com BookmarkFolder.id
type TestBookmark_FolderIdCompatibility = AssertTrue<
  IsAssignable<BookmarkFolder['id'], NonNullable<Bookmark['folder_id']>>
>;

// Valida que BookmarkFolder.parent_id é compatível com BookmarkFolder.id
type TestBookmarkFolder_ParentIdCompatibility = AssertTrue<
  IsAssignable<BookmarkFolder['id'], NonNullable<BookmarkFolder['parent_id']>>
>;

// Valida que todos os tipos de ID são strings (exceto HistoryEntry.id que é number)
type TestBookmark_IdIsString = AssertTrue<
  IsExact<Bookmark['id'], string>
>;

type TestBookmarkFolder_IdIsString = AssertTrue<
  IsExact<BookmarkFolder['id'], string>
>;

type TestTabState_IdIsString = AssertTrue<
  IsExact<TabState['id'], string>
>;

// Valida que HistoryEntry.id é number (diferente dos outros)
type TestHistoryEntry_IdIsNumber = AssertTrue<
  IsExact<NonNullable<HistoryEntry['id']>, number>
>;

// ============================================================================
// Testes de Arrays de Tipos
// ============================================================================

// Valida que arrays de tipos funcionam corretamente
type TestHistoryEntryArray = AssertTrue<
  IsAssignable<HistoryEntry[], Array<HistoryEntry>>
>;

type TestBookmarkArray = AssertTrue<
  IsAssignable<Bookmark[], Array<Bookmark>>
>;

type TestBookmarkFolderArray = AssertTrue<
  IsAssignable<BookmarkFolder[], Array<BookmarkFolder>>
>;

type TestTabStateArray = AssertTrue<
  IsAssignable<TabState[], Array<TabState>>
>;

// ============================================================================
// Testes de Partial e Required Utility Types
// ============================================================================

// Valida que Partial funciona corretamente
type TestHistoryEntry_Partial = AssertTrue<
  IsAssignable<
    Partial<HistoryEntry>,
    { id?: number; url?: string; title?: string; timestamp?: number; visit_count?: number }
  >
>;

type TestBookmark_Partial = AssertTrue<
  IsAssignable<
    Partial<Bookmark>,
    { 
      id?: string; 
      url?: string; 
      title?: string; 
      favicon?: string; 
      folder_id?: string; 
      position?: number; 
      created_at?: number; 
      updated_at?: number 
    }
  >
>;

// Valida que Required funciona corretamente (remove opcionalidade)
type TestHistoryEntry_Required = AssertTrue<
  IsExact<
    Required<HistoryEntry>['id'],
    number
  >
>;

type TestBookmark_Required = AssertTrue<
  IsExact<
    Required<Bookmark>['url'],
    string
  >
>;

// ============================================================================
// Testes de Pick e Omit Utility Types
// ============================================================================

// Valida que Pick funciona corretamente
type TestBookmark_PickIdAndTitle = AssertTrue<
  IsExact<
    Pick<Bookmark, 'id' | 'title'>,
    { id: string; title: string }
  >
>;

type TestHistoryEntry_PickUrlAndTimestamp = AssertTrue<
  IsExact<
    Pick<HistoryEntry, 'url' | 'timestamp'>,
    { url: string; timestamp: number }
  >
>;

// Valida que Omit funciona corretamente
type TestBookmark_OmitTimestamps = AssertTrue<
  IsExact<
    keyof Omit<Bookmark, 'created_at' | 'updated_at'>,
    'id' | 'url' | 'title' | 'favicon' | 'folder_id' | 'position'
  >
>;

type TestTabState_OmitFavicon = AssertTrue<
  IsExact<
    keyof Omit<TabState, 'favicon'>,
    'id' | 'url' | 'title' | 'position' | 'active'
  >
>;

// ============================================================================
// Testes de Compatibilidade com Operações Comuns
// ============================================================================

// Valida que tipos podem ser usados em operações de comparação
type TestBookmark_PositionComparison = AssertTrue<
  IsAssignable<Bookmark['position'], number>
>;

type TestHistoryEntry_TimestampComparison = AssertTrue<
  IsAssignable<HistoryEntry['timestamp'], number>
>;

// Valida que tipos podem ser usados em operações de string
type TestBookmark_TitleConcat = AssertTrue<
  IsAssignable<Bookmark['title'], string>
>;

type TestHistoryEntry_UrlConcat = AssertTrue<
  IsAssignable<HistoryEntry['url'], string>
>;

// ============================================================================
// Exportação de Tipos de Teste (para referência)
// ============================================================================

/**
 * Tipo que representa os campos obrigatórios de um Bookmark
 * Útil para validar criação de novos bookmarks
 */
export type BookmarkRequiredFields = Required<Pick<
  Bookmark,
  'id' | 'title' | 'position' | 'created_at' | 'updated_at'
>>;

/**
 * Tipo que representa os campos obrigatórios de um HistoryEntry
 * Útil para validar criação de novas entradas de histórico
 */
export type HistoryEntryRequiredFields = Required<Pick<
  HistoryEntry,
  'url' | 'title' | 'timestamp'
>>;

/**
 * Tipo que representa os campos obrigatórios de um BookmarkFolder
 * Útil para validar criação de novas pastas
 */
export type BookmarkFolderRequiredFields = Required<Pick<
  BookmarkFolder,
  'id' | 'name' | 'position' | 'created_at'
>>;

/**
 * Tipo que representa os campos obrigatórios de um TabState
 * Útil para validar criação de novos estados de aba
 */
export type TabStateRequiredFields = Required<Pick<
  TabState,
  'id' | 'url' | 'title' | 'position' | 'active'
>>;

// Valida que os tipos exportados estão corretos
type TestBookmarkRequiredFields_IsValid = AssertTrue<
  IsAssignable<BookmarkRequiredFields, Bookmark>
>;

type TestHistoryEntryRequiredFields_IsValid = AssertTrue<
  IsAssignable<HistoryEntryRequiredFields, HistoryEntry>
>;

type TestBookmarkFolderRequiredFields_IsValid = AssertTrue<
  IsAssignable<BookmarkFolderRequiredFields, BookmarkFolder>
>;

type TestTabStateRequiredFields_IsValid = AssertTrue<
  IsAssignable<TabStateRequiredFields, TabState>
>;

// Se este arquivo compila sem erros, todos os testes de tipo passaram! ✓
