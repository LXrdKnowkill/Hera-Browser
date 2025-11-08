/**
 * Tipos internos para operações de banco de dados
 * 
 * Este arquivo contém interfaces que representam a estrutura de dados
 * retornada por queries SQL internas do banco de dados.
 */

/**
 * Interface para resultados de PRAGMA table_info queries
 * Representa informações sobre colunas de uma tabela
 */
export interface TableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

/**
 * Interface para rows da tabela history
 * Representa um registro de histórico de navegação
 */
export interface HistoryRow {
  id: number;
  url: string;
  title: string;
  timestamp: number;
  visit_count: number;
  favicon: string | null;
}

/**
 * Interface para rows da tabela bookmarks
 * Representa um bookmark salvo pelo usuário
 */
export interface BookmarkRow {
  id: string;
  url: string;
  title: string;
  folder_id: string | null;
  created_at: number;
  updated_at: number;
  favicon: string | null;
  position: number;
}

/**
 * Interface para rows da tabela bookmark_folders
 * Representa uma pasta de bookmarks
 */
export interface BookmarkFolderRow {
  id: string;
  name: string;
  parent_id: string | null;
  position: number;
  created_at: number;
}

/**
 * Interface para rows da tabela downloads
 * Representa um download em progresso ou concluído
 */
export interface DownloadRow {
  id: string;
  filename: string;
  savePath: string;
  totalBytes: number;
  receivedBytes: number;
  state: string;
  timestamp: number;
}

/**
 * Interface para rows da tabela settings
 * Representa uma configuração do aplicativo
 */
export interface SettingRow {
  key: string;
  value: string;
}

/**
 * Interface para rows da tabela open_tabs
 * Representa o estado de uma aba salva
 */
export interface TabStateRow {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  active: number;
  position: number;
}
