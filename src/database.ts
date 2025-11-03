// External dependencies
import path from 'path';
import { app } from 'electron';

// Types
import type { HistoryEntry, Bookmark, BookmarkFolder, TabState } from './types';
import { validateBookmarks, validateHistoryEntries } from './types/guards';

// Importação dinâmica do sqlite3 para evitar problemas com webpack
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const sqlite3 = require('sqlite3') as any;

let db: any = null;

/**
 * Inicializa o banco de dados SQLite
 */
export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(app.getPath('userData'), 'hera-browser.db');
    
    db = new (sqlite3 as typeof import('sqlite3')).Database(dbPath, (err: Error | null) => {
      if (err) {
        console.error('Erro ao abrir banco de dados:', err);
        reject(err);
        return;
      }

      // Criar tabela de histórico se não existir
      // Removemos UNIQUE constraint e usamos lógica no INSERT
      db!.run(`
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL,
          title TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          visit_count INTEGER DEFAULT 1
        )
      `, (err: Error | null) => {
        if (err) {
          console.error('Erro ao criar tabela de histórico:', err);
          reject(err);
          return;
        }

        // Criar índice para melhorar performance de buscas
        db!.run(`
          CREATE INDEX IF NOT EXISTS idx_history_timestamp 
          ON history(timestamp DESC)
        `, (err: Error | null) => {
          if (err) {
            console.warn('Aviso: não foi possível criar índice:', err);
          }

          // Criar tabela de configurações
          db!.run(`
            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
          `, (err: Error | null) => {
            if (err) {
              console.error('Erro ao criar tabela de configurações:', err);
              reject(err);
              return;
            }

            // Criar tabela de abas abertas (para persistência)
            db!.run(`
              CREATE TABLE IF NOT EXISTS open_tabs (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                title TEXT NOT NULL,
                favicon TEXT,
                position INTEGER NOT NULL,
                active INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
              )
            `, (err: Error | null) => {
              if (err) {
                console.error('Erro ao criar tabela de abas abertas:', err);
                reject(err);
                return;
              }

              // Criar tabela de favoritos (bookmarks) com suporte a pastas
              db!.run(`
                CREATE TABLE IF NOT EXISTS bookmarks (
                  id TEXT PRIMARY KEY,
                  url TEXT,
                  title TEXT NOT NULL,
                  favicon TEXT,
                  folder_id TEXT,
                  position INTEGER DEFAULT 0,
                  created_at INTEGER DEFAULT (strftime('%s', 'now')),
                  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
                  FOREIGN KEY (folder_id) REFERENCES bookmark_folders(id) ON DELETE CASCADE
                )
              `, (err: Error | null) => {
                if (err) {
                  console.error('Erro ao criar tabela de favoritos:', err);
                  reject(err);
                  return;
                }

                // Criar tabela de pastas de favoritos
                db!.run(`
                  CREATE TABLE IF NOT EXISTS bookmark_folders (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    parent_id TEXT,
                    position INTEGER DEFAULT 0,
                    created_at INTEGER DEFAULT (strftime('%s', 'now')),
                    FOREIGN KEY (parent_id) REFERENCES bookmark_folders(id) ON DELETE CASCADE
                  )
                `, (err: Error | null) => {
                  if (err) {
                    console.error('Erro ao criar tabela de pastas de favoritos:', err);
                    reject(err);
                    return;
                  }
                  console.log('Banco de dados inicializado com sucesso');
                  resolve();
                });
              });
            });
          });
        });
      });
    });
  });
};

/**
 * Adiciona uma entrada ao histórico
 */
export const addHistoryEntry = (url: string, title: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    // Ignora URLs internas
    if (url.startsWith('hera://')) {
      resolve();
      return;
    }

    // Primeiro, verifica se já existe uma entrada com essa URL (independente do título)
    db.get(
      'SELECT id, visit_count FROM history WHERE url = ?',
      [url],
      (err: Error | null, row: { id: number; visit_count: number } | undefined) => {
        if (err) {
          console.error('Erro ao verificar histórico:', err);
          resolve(); // Não bloqueia se houver erro
          return;
        }

        if (row) {
          // Se existe, atualiza o timestamp, título e incrementa visit_count
          db!.run(
            'UPDATE history SET title = ?, timestamp = ?, visit_count = visit_count + 1 WHERE id = ?',
            [title, Date.now(), row.id],
            (updateErr: Error | null) => {
              if (updateErr) {
                console.error('Erro ao atualizar histórico:', updateErr);
              }
              resolve();
            }
          );
        } else {
          // Se não existe, insere nova entrada
          db!.run(
            'INSERT INTO history (url, title, timestamp, visit_count) VALUES (?, ?, ?, ?)',
            [url, title, Date.now(), 1],
            (insertErr: Error | null) => {
              if (insertErr) {
                console.error('Erro ao inserir no histórico:', insertErr);
              }
              resolve();
            }
          );
        }
      }
    );
  });
};

/**
 * Retorna o histórico ordenado por timestamp (mais recente primeiro)
 */
export const getHistory = (limit: number = 1000): Promise<HistoryEntry[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    db.all(
      'SELECT * FROM history ORDER BY timestamp DESC LIMIT ?',
      [limit],
      (err: Error | null, rows: unknown[]) => {
        if (err) {
          console.error('Erro ao buscar histórico:', err);
          reject(err);
          return;
        }
        const validatedHistory = validateHistoryEntries(rows);
        resolve(validatedHistory);
      }
    );
  });
};

/**
 * Limpa todo o histórico
 */
export const clearHistory = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    db.run('DELETE FROM history', (err: Error | null) => {
      if (err) {
        console.error('Erro ao limpar histórico:', err);
        reject(err);
        return;
      }
      console.log('Histórico limpo com sucesso');
      resolve();
    });
  });
};

/**
 * Obtém uma configuração
 */
export const getSetting = (key: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    db.get('SELECT value FROM settings WHERE key = ?', [key], (err: Error | null, row: { value: string } | undefined) => {
      if (err) {
        console.error('Erro ao buscar configuração:', err);
        reject(err);
        return;
      }
      resolve(row ? row.value : null);
    });
  });
};

/**
 * Salva uma configuração
 */
export const setSetting = (key: string, value: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    db.run(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      [key, value, Date.now()],
      (err: Error | null) => {
        if (err) {
          console.error('Erro ao salvar configuração:', err);
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
};

/**
 * Obtém todas as configurações como objeto
 */
export const getAllSettings = (): Promise<Record<string, string>> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    db.all('SELECT key, value FROM settings', [], (err: Error | null, rows: { key: string; value: string }[]) => {
      if (err) {
        console.error('Erro ao buscar configurações:', err);
        reject(err);
        return;
      }

      const settings: Record<string, string> = {};
      rows.forEach((row) => {
        settings[row.key] = row.value;
      });
      resolve(settings);
    });
  });
};

/**
 * Salva o estado das abas abertas
 */
export const saveOpenTabs = (tabs: TabState[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    // Limpa todas as abas salvas
    db.run('DELETE FROM open_tabs', (err: Error | null) => {
      if (err) {
        console.error('Erro ao limpar abas salvas:', err);
        reject(err);
        return;
      }

      // Insere todas as abas
      if (tabs.length === 0) {
        resolve();
        return;
      }

      let completed = 0;
      let hasError = false;

      tabs.forEach((tab) => {
        db!.run(
          'INSERT INTO open_tabs (id, url, title, favicon, position, active) VALUES (?, ?, ?, ?, ?, ?)',
          [tab.id, tab.url, tab.title, tab.favicon || null, tab.position, tab.active ? 1 : 0],
          (err: Error | null) => {
            if (err && !hasError) {
              hasError = true;
              console.error('Erro ao salvar aba:', err);
              reject(err);
            } else {
              completed++;
              if (completed === tabs.length && !hasError) {
                console.log(`${tabs.length} abas salvas com sucesso`);
                resolve();
              }
            }
          }
        );
      });
    });
  });
};

/**
 * Carrega o estado das abas salvas
 */
export const loadOpenTabs = (): Promise<TabState[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    db.all(
      'SELECT * FROM open_tabs ORDER BY position ASC',
      [],
      (err: Error | null, rows: { id: string; url: string; title: string; favicon: string | null; position: number; active: number }[]) => {
        if (err) {
          console.error('Erro ao carregar abas salvas:', err);
          reject(err);
          return;
        }

        const tabs: TabState[] = rows.map((row) => ({
          id: row.id,
          url: row.url,
          title: row.title,
          favicon: row.favicon || undefined,
          position: row.position,
          active: row.active === 1,
        }));

        resolve(tabs);
      }
    );
  });
};

/**
 * Limpa todas as abas salvas
 */
export const clearOpenTabs = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    db.run('DELETE FROM open_tabs', (err: Error | null) => {
      if (err) {
        console.error('Erro ao limpar abas salvas:', err);
        reject(err);
        return;
      }
      resolve();
    });
  });
};

/**
 * Adiciona um favorito
 */
export const addBookmark = (url: string, title: string, favicon?: string, folderId?: string): Promise<Bookmark> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    const id = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    db.run(
      'INSERT INTO bookmarks (id, url, title, favicon, folder_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, url, title, favicon || null, folderId || null, timestamp, timestamp],
      (err: Error | null) => {
        if (err) {
          console.error('Erro ao adicionar favorito:', err);
          reject(err);
          return;
        }
        resolve({ id, url, title, favicon, folder_id: folderId, position: 0, created_at: timestamp, updated_at: timestamp });
      }
    );
  });
};

/**
 * Remove um favorito
 */
export const removeBookmark = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    db.run('DELETE FROM bookmarks WHERE id = ?', [id], (err: Error | null) => {
      if (err) {
        console.error('Erro ao remover favorito:', err);
        reject(err);
        return;
      }
      resolve();
    });
  });
};

/**
 * Obtém todos os favoritos (opcionalmente filtrados por pasta)
 */
export const getBookmarks = (folderId?: string): Promise<Bookmark[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    const query = folderId 
      ? 'SELECT * FROM bookmarks WHERE folder_id = ? ORDER BY position ASC, created_at DESC'
      : 'SELECT * FROM bookmarks WHERE folder_id IS NULL ORDER BY position ASC, created_at DESC';
    
    db.all(query, folderId ? [folderId] : [], (err: Error | null, rows: unknown[]) => {
      if (err) {
        console.error('Erro ao buscar favoritos:', err);
        reject(err);
        return;
      }

      const bookmarks: Bookmark[] = rows.map((row: any) => ({
        id: row.id,
        url: row.url,
        title: row.title,
        favicon: row.favicon || undefined,
        folder_id: row.folder_id || undefined,
        position: row.position,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      const validatedBookmarks = validateBookmarks(bookmarks);
      resolve(validatedBookmarks);
    });
  });
};

/**
 * Busca favoritos por texto (título ou URL)
 */
export const searchBookmarks = (query: string): Promise<Bookmark[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    const searchTerm = `%${query}%`;
    db.all(
      'SELECT * FROM bookmarks WHERE title LIKE ? OR url LIKE ? ORDER BY updated_at DESC',
      [searchTerm, searchTerm],
      (err: Error | null, rows: unknown[]) => {
        if (err) {
          console.error('Erro ao buscar favoritos:', err);
          reject(err);
          return;
        }

        const bookmarks: Bookmark[] = rows.map((row: any) => ({
          id: row.id,
          url: row.url,
          title: row.title,
          favicon: row.favicon || undefined,
          folder_id: row.folder_id || undefined,
          position: row.position,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        const validatedBookmarks = validateBookmarks(bookmarks);
        resolve(validatedBookmarks);
      }
    );
  });
};

/**
 * Cria uma pasta de favoritos
 */
export const createBookmarkFolder = (name: string, parentId?: string): Promise<BookmarkFolder> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    db.run(
      'INSERT INTO bookmark_folders (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)',
      [id, name, parentId || null, timestamp],
      (err: Error | null) => {
        if (err) {
          console.error('Erro ao criar pasta de favoritos:', err);
          reject(err);
          return;
        }
        resolve({ id, name, parent_id: parentId, position: 0, created_at: timestamp });
      }
    );
  });
};

/**
 * Obtém todas as pastas
 */
export const getBookmarkFolders = (parentId?: string): Promise<BookmarkFolder[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Banco de dados não inicializado'));
      return;
    }

    const query = parentId
      ? 'SELECT * FROM bookmark_folders WHERE parent_id = ? ORDER BY position ASC, name ASC'
      : 'SELECT * FROM bookmark_folders WHERE parent_id IS NULL ORDER BY position ASC, name ASC';
    
    db.all(query, parentId ? [parentId] : [], (err: Error | null, rows: { id: string; name: string; parent_id: string | null; position: number; created_at: number }[]) => {
      if (err) {
        console.error('Erro ao buscar pastas de favoritos:', err);
        reject(err);
        return;
      }

      const folders: BookmarkFolder[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        parent_id: row.parent_id || undefined,
        position: row.position,
        created_at: row.created_at,
      }));

      resolve(folders);
    });
  });
};

/**
 * Fecha a conexão com o banco de dados
 */
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve) => {
    if (db) {
      db.close((err: Error | null) => {
        if (err) {
          console.error('Erro ao fechar banco de dados:', err);
        } else {
          console.log('Banco de dados fechado');
        }
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

