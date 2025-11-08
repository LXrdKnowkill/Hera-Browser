// External dependencies
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

// Fix for webpack-asset-relocator-loader not setting __webpack_require__.ab in dev mode
// This is a known issue where the asset base path is undefined, causing better-sqlite3 to fail
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - __webpack_require__ is a webpack internal variable
if (typeof __webpack_require__ !== 'undefined' && !__webpack_require__.ab) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error - Setting the asset base path manually
  __webpack_require__.ab = path.join(__dirname, 'native_modules/');
}

import BetterSqlite3 from 'better-sqlite3';

// Types
import type { HistoryEntry, Bookmark, BookmarkFolder, TabState } from './types';
import { validateBookmarks, validateHistoryEntries } from './types/guards';
import type { TableColumnInfo, HistoryRow, BookmarkRow, DownloadRow, TabStateRow, BookmarkFolderRow } from './types/database-internal.types';
import Database from 'better-sqlite3';

let db: BetterSqlite3.Database | null = null;

/**
 * Inicializa o banco de dados SQLite
 */
export const initDatabase = (): void => {
  try {
    console.log('[Database] Iniciando inicialização...');
    console.log('[Database] Verificando módulo Database:', typeof Database);
    console.log('[Database] Dev mode:', !app.isPackaged);

    const userDataPath = app.getPath('userData');

    // ✅ CORREÇÃO: Garantir que o diretório existe
    if (!fs.existsSync(userDataPath)) {
      console.warn(`[Database] Diretório userData não existe. Criando: ${userDataPath}`);
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'hera-browser.db');
    console.log('[Database] Caminho do banco:', dbPath);
    console.log('[Database] UserData path:', userDataPath);

    console.log('[Database] Tentando criar instância do Database...');
    db = new BetterSqlite3(dbPath);

    // ✅ Testar conexão imediatamente
    db.prepare('SELECT 1').get();
    console.log('[Database] ✅ Connection test passed');
    console.log('[Database] ✅ Banco de dados aberto com sucesso');

    // Criar tabela de histórico
    db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        visit_count INTEGER DEFAULT 1,
        favicon TEXT
      )
    `);

    // Migração: adicionar coluna favicon se não existir
    try {
      const tableInfo = db.prepare("PRAGMA table_info(history)").all() as TableColumnInfo[];
      const hasFavicon = tableInfo.some((col) => col.name === 'favicon');
      if (!hasFavicon) {
        console.log('[Database] Adicionando coluna favicon à tabela history...');
        db.exec('ALTER TABLE history ADD COLUMN favicon TEXT');
        console.log('[Database] ✅ Coluna favicon adicionada');
      }
    } catch (error) {
      console.error('[Database] Erro ao verificar/adicionar coluna favicon:', error);
    }

    // Criar índice para buscas rápidas
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
      CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC);
    `);

    // Criar tabela de abas abertas
    db.exec(`
      CREATE TABLE IF NOT EXISTS open_tabs (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        favicon TEXT,
        position INTEGER NOT NULL,
        active INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Criar tabela de favoritos
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        url TEXT,
        title TEXT NOT NULL,
        favicon TEXT,
        folder_id TEXT,
        position INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Criar tabela de pastas de favoritos
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookmark_folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        position INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Criar tabela de configurações
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Criar tabela de downloads
    db.exec(`
      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        savePath TEXT,
        totalBytes INTEGER,
        receivedBytes INTEGER,
        state TEXT DEFAULT 'downloading',
        timestamp INTEGER
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_downloads_timestamp ON downloads(timestamp DESC);
    `);

    console.log('[Database] ✅ Todas as tabelas criadas com sucesso');
  } catch (error) {
    console.error('[Database] ❌ Erro ao inicializar banco:', error);

    // ✅ Fallback para in-memory database no dev mode
    if (!app.isPackaged) {
      console.warn('[Database] Usando banco em memória (dev mode fallback)');
      try {
        db = new BetterSqlite3(':memory:');
        // Recriar todas as tabelas no banco em memória
        db.exec(`
          CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            visit_count INTEGER DEFAULT 1,
            favicon TEXT
          )
        `);
        console.log('[Database] ✅ Banco em memória inicializado');
        return;
      } catch (memError) {
        console.error('[Database] ❌ Falha ao criar banco em memória:', memError);
      }
    }

    throw error;
  }
};

/**
 * Adiciona uma entrada ao histórico
 */
export const addHistoryEntry = (url: string, title: string, favicon?: string): void => {
  if (!db) throw new Error('Database not initialized');

  // Ignora URLs internas
  if (url.startsWith('hera://')) {
    return;
  }

  try {
    // Verifica se a URL já existe
    const existing = db.prepare('SELECT id, visit_count FROM history WHERE url = ?').get(url) as { id: number; visit_count: number } | undefined;

    if (existing) {
      // Atualiza contador de visitas e timestamp
      db.prepare(`
        UPDATE history 
        SET visit_count = visit_count + 1, 
            timestamp = ?, 
            title = ?,
            favicon = COALESCE(?, favicon)
        WHERE id = ?
      `).run(Date.now(), title, favicon, existing.id);
    } else {
      // Insere nova entrada
      db.prepare(`
        INSERT INTO history (url, title, timestamp, favicon) 
        VALUES (?, ?, ?, ?)
      `).run(url, title, Date.now(), favicon);
    }
  } catch (error) {
    console.error('[Database] Erro ao adicionar ao histórico:', error);
  }
};

/**
 * Obtém todo o histórico
 */
export const getHistory = (): HistoryEntry[] => {
  if (!db) throw new Error('Database not initialized');

  try {
    const rows = db.prepare(`
      SELECT id, url, title, timestamp, visit_count, favicon 
      FROM history 
      ORDER BY timestamp DESC 
      LIMIT 1000
    `).all() as HistoryRow[];

    const history: HistoryEntry[] = rows.map(row => ({
      id: row.id,
      url: row.url,
      title: row.title,
      timestamp: row.timestamp,
      visit_count: row.visit_count,
      favicon: row.favicon || undefined
    }));

    return validateHistoryEntries(history);
  } catch (error) {
    console.error('[Database] Erro ao buscar histórico:', error);
    return [];
  }
};

/**
 * Limpa todo o histórico
 */
export const clearHistory = (): void => {
  if (!db) throw new Error('Database not initialized');

  try {
    db.prepare('DELETE FROM history').run();
    console.log('[Database] Histórico limpo com sucesso');
  } catch (error) {
    console.error('[Database] Erro ao limpar histórico:', error);
    throw error;
  }
};

/**
 * Adiciona um favorito
 */
export const addBookmark = (id: string, url: string, title: string, favicon?: string, folderId?: string): Bookmark => {
  if (!db) throw new Error('Database not initialized');

  try {
    const position = db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE folder_id IS ?').get(folderId || null) as { count: number };

    db.prepare(`
      INSERT INTO bookmarks (id, url, title, favicon, folder_id, position) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, url, title, favicon, folderId, position.count);

    return {
      id,
      url,
      title,
      favicon,
      folder_id: folderId,
      position: position.count,
      created_at: Date.now(),
      updated_at: Date.now()
    };
  } catch (error) {
    console.error('[Database] Erro ao adicionar favorito:', error);
    throw error;
  }
};

/**
 * Remove um favorito
 */
export const removeBookmark = (id: string): boolean => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
    return result.changes > 0;
  } catch (error) {
    console.error('[Database] Erro ao remover favorito:', error);
    return false;
  }
};

/**
 * Obtém favoritos de uma pasta
 */
export const getBookmarks = (folderId?: string): Bookmark[] => {
  if (!db) throw new Error('Database not initialized');

  try {
    const rows = db.prepare(`
      SELECT id, url, title, favicon, folder_id, position, created_at, updated_at 
      FROM bookmarks 
      WHERE folder_id IS ? 
      ORDER BY position ASC
    `).all(folderId || null) as BookmarkRow[];

    const bookmarks: Bookmark[] = rows.map(row => ({
      id: row.id,
      url: row.url,
      title: row.title,
      favicon: row.favicon || undefined,
      folder_id: row.folder_id || undefined,
      position: row.position,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return validateBookmarks(bookmarks);
  } catch (error) {
    console.error('[Database] Erro ao buscar favoritos:', error);
    return [];
  }
};

/**
 * Busca favoritos por título ou URL
 */
export const searchBookmarks = (query: string): Bookmark[] => {
  if (!db) throw new Error('Database not initialized');

  try {
    const rows = db.prepare(`
      SELECT id, url, title, favicon, folder_id, position, created_at, updated_at 
      FROM bookmarks 
      WHERE title LIKE ? OR url LIKE ? 
      ORDER BY position ASC
    `).all(`%${query}%`, `%${query}%`) as BookmarkRow[];

    const bookmarks: Bookmark[] = rows.map(row => ({
      id: row.id,
      url: row.url,
      title: row.title,
      favicon: row.favicon || undefined,
      folder_id: row.folder_id || undefined,
      position: row.position,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return validateBookmarks(bookmarks);
  } catch (error) {
    console.error('[Database] Erro ao buscar favoritos:', error);
    return [];
  }
};

/**
 * Cria uma pasta de favoritos
 */
export const createBookmarkFolder = (id: string, name: string, parentId?: string): BookmarkFolder => {
  if (!db) throw new Error('Database not initialized');

  try {
    const position = db.prepare('SELECT COUNT(*) as count FROM bookmark_folders WHERE parent_id IS ?').get(parentId || null) as { count: number };

    db.prepare(`
      INSERT INTO bookmark_folders (id, name, parent_id, position) 
      VALUES (?, ?, ?, ?)
    `).run(id, name, parentId, position.count);

    return {
      id,
      name,
      parent_id: parentId,
      position: position.count,
      created_at: Date.now()
    };
  } catch (error) {
    console.error('[Database] Erro ao criar pasta:', error);
    throw error;
  }
};

/**
 * Obtém pastas de favoritos
 */
export const getBookmarkFolders = (parentId?: string): BookmarkFolder[] => {
  if (!db) throw new Error('Database not initialized');

  try {
    const rows = db.prepare(`
      SELECT id, name, parent_id, position, created_at 
      FROM bookmark_folders 
      WHERE parent_id IS ? 
      ORDER BY position ASC
    `).all(parentId || null) as BookmarkFolderRow[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      parent_id: row.parent_id || undefined,
      position: row.position,
      created_at: row.created_at
    }));
  } catch (error) {
    console.error('[Database] Erro ao buscar pastas:', error);
    return [];
  }
};

/**
 * Salva o estado das abas abertas
 */
export const saveTabsState = (tabs: TabState[]): void => {
  if (!db) throw new Error('Database not initialized');

  try {
    // Limpa abas antigas
    db.prepare('DELETE FROM open_tabs').run();

    // Insere todas as abas
    const insert = db.prepare(`
      INSERT INTO open_tabs (id, url, title, favicon, position, active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((tabs: TabState[]) => {
      for (const tab of tabs) {
        insert.run(tab.id, tab.url, tab.title, tab.favicon, tab.position, tab.active ? 1 : 0);
      }
    });

    insertMany(tabs);
    console.log(`[Database] ${tabs.length} abas salvas com sucesso`);
  } catch (error) {
    console.error('[Database] Erro ao salvar abas:', error);
    throw error;
  }
};

/**
 * Obtém o estado das abas salvas
 */
export const getTabsState = (): TabState[] => {
  if (!db) throw new Error('Database not initialized');

  try {
    const rows = db.prepare(`
      SELECT id, url, title, favicon, position, active 
      FROM open_tabs 
      ORDER BY position ASC
    `).all() as TabStateRow[];

    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      title: row.title,
      favicon: row.favicon || undefined,
      position: row.position,
      active: row.active === 1
    }));
  } catch (error) {
    console.error('[Database] Erro ao buscar abas:', error);
    return [];
  }
};

/**
 * Obtém uma configuração
 */
export const getSetting = (key: string): string | null => {
  if (!db) throw new Error('Database not initialized');

  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
  } catch (error) {
    console.error('[Database] Erro ao buscar configuração:', error);
    return null;
  }
};

/**
 * Define uma configuração
 */
export const setSetting = (key: string, value: string): boolean => {
  if (!db) throw new Error('Database not initialized');

  try {
    db.prepare(`
      INSERT INTO settings (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
    return true;
  } catch (error) {
    console.error('[Database] Erro ao salvar configuração:', error);
    return false;
  }
};

/**
 * Obtém todas as configurações
 */
export const getAllSettings = (): Record<string, string> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  } catch (error) {
    console.error('[Database] Erro ao buscar configurações:', error);
    return {};
  }
};

/**
 * Adiciona um download ao banco
 */
export const addDownload = (id: string, filename: string, savePath: string, totalBytes: number): void => {
  if (!db) throw new Error('Database not initialized');

  try {
    db.prepare(`
      INSERT INTO downloads (id, filename, savePath, totalBytes, receivedBytes, state, timestamp)
      VALUES (?, ?, ?, ?, 0, 'downloading', ?)
    `).run(id, filename, savePath, totalBytes, Date.now());
  } catch (error) {
    console.error('[Database] Erro ao adicionar download:', error);
    throw error;
  }
};

/**
 * Atualiza o progresso de um download
 */
export const updateDownloadProgress = (id: string, receivedBytes: number): void => {
  if (!db) throw new Error('Database not initialized');

  try {
    db.prepare('UPDATE downloads SET receivedBytes = ? WHERE id = ?')
      .run(receivedBytes, id);
  } catch (error) {
    console.error('[Database] Erro ao atualizar progresso:', error);
  }
};

/**
 * Atualiza o estado de um download
 */
export const updateDownloadState = (id: string, state: string, savePath: string): void => {
  if (!db) throw new Error('Database not initialized');

  try {
    db.prepare('UPDATE downloads SET state = ?, savePath = ? WHERE id = ?')
      .run(state, savePath, id);
  } catch (error) {
    console.error('[Database] Erro ao atualizar estado:', error);
    throw error;
  }
};

/**
 * Interface para o resultado de download com progresso calculado
 */
interface DownloadWithProgress extends DownloadRow {
  progress: number;
}

/**
 * Obtém todos os downloads
 */
export const getDownloads = (): DownloadWithProgress[] => {
  if (!db) throw new Error('Database not initialized');

  try {
    const rows = db.prepare(`
      SELECT id, filename, savePath, totalBytes, receivedBytes, state, timestamp
      FROM downloads
      ORDER BY timestamp DESC
    `).all() as DownloadRow[];

    return rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      savePath: row.savePath,
      totalBytes: row.totalBytes,
      receivedBytes: row.receivedBytes,
      state: row.state,
      progress: (row.totalBytes > 0) ? (row.receivedBytes / row.totalBytes) * 100 : 0,
      timestamp: row.timestamp
    }));
  } catch (error) {
    console.error('[Database] Erro ao buscar downloads:', error);
    return [];
  }
};

/**
 * Remove downloads concluídos
 */
export const clearCompletedDownloads = (): void => {
  if (!db) throw new Error('Database not initialized');

  try {
    db.prepare("DELETE FROM downloads WHERE state = 'completed'").run();
    console.log('[Database] Downloads concluídos removidos');
  } catch (error) {
    console.error('[Database] Erro ao limpar downloads:', error);
    throw error;
  }
};

/**
 * Remove um download específico
 */
export const removeDownload = (id: string): boolean => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.prepare('DELETE FROM downloads WHERE id = ?').run(id);
    return result.changes > 0;
  } catch (error) {
    console.error('[Database] Erro ao remover download:', error);
    return false;
  }
};

/**
 * Fecha o banco de dados
 */
export const closeDatabase = (): void => {
  if (db) {
    try {
      db.close();
      db = null;
      console.log('[Database] Banco de dados fechado');
    } catch (error) {
      console.error('[Database] Erro ao fechar banco:', error);
    }
  }
};
