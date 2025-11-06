// External dependencies
import path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';

// Types
import type { HistoryEntry, Bookmark, BookmarkFolder, TabState } from './types';
import { validateBookmarks, validateHistoryEntries } from './types/guards';

let db: Database.Database | null = null;

/**
 * Inicializa o banco de dados SQLite
 */
export const initDatabase = (): void => {
  try {
    console.log('[Database] Iniciando inicialização...');
    console.log('[Database] Verificando módulo Database:', typeof Database);
    
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'hera-browser.db');
    console.log('[Database] Caminho do banco:', dbPath);
    console.log('[Database] UserData path:', userDataPath);
    
    console.log('[Database] Tentando criar instância do Database...');
    db = new Database(dbPath);
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
      const tableInfo = db.prepare("PRAGMA table_info(history)").all() as any[];
      const hasFavicon = tableInfo.some((col: any) => col.name === 'favicon');
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

    console.log('[Database] ✅ Todas as tabelas criadas com sucesso');
  } catch (error) {
    console.error('[Database] ❌ Erro ao inicializar banco:', error);
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
    `).all() as any[];

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
    `).all(folderId || null) as any[];

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
    `).all(`%${query}%`, `%${query}%`) as any[];

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
    `).all(parentId || null) as any[];

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = db.prepare(`
      SELECT id, url, title, favicon, position, active 
      FROM open_tabs 
      ORDER BY position ASC
    `).all() as unknown[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((row: any) => ({
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
