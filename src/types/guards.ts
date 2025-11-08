/**
 * Type Guards para validação em runtime
 * 
 * Este módulo fornece funções de validação que verificam se objetos
 * correspondem às interfaces TypeScript esperadas em tempo de execução.
 * Isso é especialmente importante para dados vindos de fontes externas
 * como IPC, banco de dados, ou APIs.
 */

import { Bookmark, BookmarkFolder, HistoryEntry } from './database.types';

/**
 * Verifica se um objeto é um Bookmark válido
 * 
 * Type guard que valida se um objeto desconhecido corresponde à interface Bookmark.
 * Útil para validar dados vindos de fontes externas como IPC ou banco de dados.
 * 
 * @param obj - Objeto a ser validado (pode ser de qualquer tipo)
 * @returns true se o objeto é um Bookmark válido, false caso contrário
 * 
 * @remarks
 * Validações realizadas:
 * - Campos obrigatórios: id (string), title (string), position (number), created_at (number), updated_at (number)
 * - Campos opcionais: url (string), favicon (string), folder_id (string)
 * - Não valida se os valores fazem sentido (ex: timestamps negativos, URLs malformadas)
 * - Não há logging nesta função (use validateBookmarks para logging)
 * 
 * @example
 * ```typescript
 * const data: unknown = await fetchFromDatabase();
 * if (isBookmark(data)) {
 *   // TypeScript agora sabe que data é um Bookmark
 *   console.log(data.title);
 * }
 * ```
 */
export function isBookmark(obj: unknown): obj is Bookmark {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const b = obj as Partial<Bookmark>;
  
  // Campos obrigatórios
  if (typeof b.id !== 'string') {
    return false;
  }
  if (typeof b.title !== 'string') {
    return false;
  }
  if (typeof b.position !== 'number') {
    return false;
  }
  if (typeof b.created_at !== 'number') {
    return false;
  }
  if (typeof b.updated_at !== 'number') {
    return false;
  }
  
  // Campos opcionais (se presentes, devem ter o tipo correto)
  if (b.url !== undefined && typeof b.url !== 'string') {
    return false;
  }
  if (b.favicon !== undefined && typeof b.favicon !== 'string') {
    return false;
  }
  if (b.folder_id !== undefined && typeof b.folder_id !== 'string') {
    return false;
  }
  
  return true;
}

/**
 * Verifica se um objeto é um BookmarkFolder válido
 * 
 * Type guard que valida se um objeto desconhecido corresponde à interface BookmarkFolder.
 * Útil para validar dados vindos de fontes externas como IPC ou banco de dados.
 * 
 * @param obj - Objeto a ser validado (pode ser de qualquer tipo)
 * @returns true se o objeto é um BookmarkFolder válido, false caso contrário
 * 
 * @remarks
 * Validações realizadas:
 * - Campos obrigatórios: id (string), name (string), position (number), created_at (number)
 * - Campos opcionais: parent_id (string)
 * - Não valida referências circulares ou se parent_id existe
 * - Não há logging nesta função (use validateBookmarkFolders para logging)
 * 
 * @example
 * ```typescript
 * const data: unknown = await fetchFromDatabase();
 * if (isBookmarkFolder(data)) {
 *   // TypeScript agora sabe que data é um BookmarkFolder
 *   console.log(data.name);
 * }
 * ```
 */
export function isBookmarkFolder(obj: unknown): obj is BookmarkFolder {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const f = obj as Partial<BookmarkFolder>;
  
  // Campos obrigatórios
  if (typeof f.id !== 'string') {
    return false;
  }
  if (typeof f.name !== 'string') {
    return false;
  }
  if (typeof f.position !== 'number') {
    return false;
  }
  if (typeof f.created_at !== 'number') {
    return false;
  }
  
  // Campos opcionais (se presentes, devem ter o tipo correto)
  if (f.parent_id !== undefined && typeof f.parent_id !== 'string') {
    return false;
  }
  
  return true;
}

/**
 * Verifica se um objeto é um HistoryEntry válido
 * 
 * Type guard que valida se um objeto desconhecido corresponde à interface HistoryEntry.
 * Útil para validar dados vindos de fontes externas como IPC ou banco de dados.
 * 
 * @param obj - Objeto a ser validado (pode ser de qualquer tipo)
 * @returns true se o objeto é um HistoryEntry válido, false caso contrário
 * 
 * @remarks
 * Validações realizadas:
 * - Campos obrigatórios: url (string), title (string), timestamp (number)
 * - Campos opcionais: id (number), visit_count (number)
 * - Não valida se a URL é válida ou se o timestamp faz sentido
 * - Não há logging nesta função (use validateHistoryEntries para logging)
 * 
 * @example
 * ```typescript
 * const data: unknown = await fetchFromDatabase();
 * if (isHistoryEntry(data)) {
 *   // TypeScript agora sabe que data é um HistoryEntry
 *   console.log(data.url);
 * }
 * ```
 */
export function isHistoryEntry(obj: unknown): obj is HistoryEntry {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const h = obj as Partial<HistoryEntry>;
  
  // Campos obrigatórios
  if (typeof h.url !== 'string') {
    return false;
  }
  if (typeof h.title !== 'string') {
    return false;
  }
  if (typeof h.timestamp !== 'number') {
    return false;
  }
  
  // Campos opcionais (se presentes, devem ter o tipo correto)
  if (h.id !== undefined && typeof h.id !== 'number') {
    return false;
  }
  if (h.visit_count !== undefined && typeof h.visit_count !== 'number') {
    return false;
  }
  
  return true;
}

/**
 * Valida um array de bookmarks, filtrando itens inválidos
 * 
 * Função de validação que processa um array de dados desconhecidos e retorna
 * apenas os bookmarks válidos. Útil para sanitizar dados vindos de IPC ou banco de dados.
 * 
 * @param data - Dados a serem validados (esperado ser um array, mas aceita qualquer tipo)
 * @returns Array de bookmarks válidos (pode estar vazio se todos forem inválidos ou se data não for array)
 * 
 * @remarks
 * Comportamento de logging:
 * - Loga erro no console se data não for um array
 * - Loga warning para cada bookmark inválido encontrado
 * - Loga warning com resumo se algum bookmark foi filtrado
 * - Todos os logs incluem prefixo [validateBookmarks] para fácil identificação
 * 
 * Comportamento de validação:
 * - Usa isBookmark() para validar cada item
 * - Filtra silenciosamente itens inválidos (não lança exceções)
 * - Retorna array vazio se data não for um array
 * - Preserva a ordem dos bookmarks válidos
 * 
 * @example
 * ```typescript
 * const rawData: unknown = await window.heraAPI.getBookmarks();
 * const bookmarks = validateBookmarks(rawData);
 * // bookmarks agora é um Bookmark[] seguro para usar
 * bookmarks.forEach(b => console.log(b.title));
 * ```
 */
export function validateBookmarks(data: unknown): Bookmark[] {
  if (!Array.isArray(data)) {
    console.error('[validateBookmarks] Erro: dados recebidos não são um array', typeof data);
    return [];
  }
  
  const validBookmarks: Bookmark[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (isBookmark(item)) {
      validBookmarks.push(item);
    } else {
      console.warn(`[validateBookmarks] Aviso: bookmark inválido no índice ${i}:`, item);
    }
  }
  
  if (validBookmarks.length !== data.length) {
    console.warn(
      `[validateBookmarks] ${data.length - validBookmarks.length} bookmark(s) inválido(s) foram filtrados. ` +
      `Total válido: ${validBookmarks.length}/${data.length}`
    );
  }
  
  return validBookmarks;
}

/**
 * Valida um array de pastas de bookmarks, filtrando itens inválidos
 * 
 * Função de validação que processa um array de dados desconhecidos e retorna
 * apenas as pastas válidas. Útil para sanitizar dados vindos de IPC ou banco de dados.
 * 
 * @param data - Dados a serem validados (esperado ser um array, mas aceita qualquer tipo)
 * @returns Array de pastas válidas (pode estar vazio se todas forem inválidas ou se data não for array)
 * 
 * @remarks
 * Comportamento de logging:
 * - Loga erro no console se data não for um array
 * - Loga warning para cada pasta inválida encontrada
 * - Loga warning com resumo se alguma pasta foi filtrada
 * - Todos os logs incluem prefixo [validateBookmarkFolders] para fácil identificação
 * 
 * Comportamento de validação:
 * - Usa isBookmarkFolder() para validar cada item
 * - Filtra silenciosamente itens inválidos (não lança exceções)
 * - Retorna array vazio se data não for um array
 * - Preserva a ordem das pastas válidas
 * - Não valida referências circulares ou hierarquia
 * 
 * @example
 * ```typescript
 * const rawData: unknown = await window.heraAPI.getBookmarkFolders();
 * const folders = validateBookmarkFolders(rawData);
 * // folders agora é um BookmarkFolder[] seguro para usar
 * folders.forEach(f => console.log(f.name));
 * ```
 */
export function validateBookmarkFolders(data: unknown): BookmarkFolder[] {
  if (!Array.isArray(data)) {
    console.error('[validateBookmarkFolders] Erro: dados recebidos não são um array', typeof data);
    return [];
  }
  
  const validFolders: BookmarkFolder[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (isBookmarkFolder(item)) {
      validFolders.push(item);
    } else {
      console.warn(`[validateBookmarkFolders] Aviso: pasta inválida no índice ${i}:`, item);
    }
  }
  
  if (validFolders.length !== data.length) {
    console.warn(
      `[validateBookmarkFolders] ${data.length - validFolders.length} pasta(s) inválida(s) foram filtradas. ` +
      `Total válido: ${validFolders.length}/${data.length}`
    );
  }
  
  return validFolders;
}

/**
 * Valida um array de entradas de histórico, filtrando itens inválidos
 * 
 * Função de validação que processa um array de dados desconhecidos e retorna
 * apenas as entradas de histórico válidas. Útil para sanitizar dados vindos de IPC ou banco de dados.
 * 
 * @param data - Dados a serem validados (esperado ser um array, mas aceita qualquer tipo)
 * @returns Array de entradas de histórico válidas (pode estar vazio se todas forem inválidas ou se data não for array)
 * 
 * @remarks
 * Comportamento de logging:
 * - Loga erro no console se data não for um array
 * - Loga warning para cada entrada inválida encontrada
 * - Loga warning com resumo se alguma entrada foi filtrada
 * - Todos os logs incluem prefixo [validateHistoryEntries] para fácil identificação
 * 
 * Comportamento de validação:
 * - Usa isHistoryEntry() para validar cada item
 * - Filtra silenciosamente itens inválidos (não lança exceções)
 * - Retorna array vazio se data não for um array
 * - Preserva a ordem das entradas válidas
 * - Não valida se URLs são válidas ou timestamps fazem sentido
 * 
 * @example
 * ```typescript
 * const rawData: unknown = await window.heraAPI.getHistory();
 * const history = validateHistoryEntries(rawData);
 * // history agora é um HistoryEntry[] seguro para usar
 * history.forEach(h => console.log(h.url));
 * ```
 */
export function validateHistoryEntries(data: unknown): HistoryEntry[] {
  if (!Array.isArray(data)) {
    console.error('[validateHistoryEntries] Erro: dados recebidos não são um array', typeof data);
    return [];
  }
  
  const validEntries: HistoryEntry[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (isHistoryEntry(item)) {
      validEntries.push(item);
    } else {
      console.warn(`[validateHistoryEntries] Aviso: entrada de histórico inválida no índice ${i}:`, item);
    }
  }
  
  if (validEntries.length !== data.length) {
    console.warn(
      `[validateHistoryEntries] ${data.length - validEntries.length} entrada(s) de histórico inválida(s) foram filtradas. ` +
      `Total válido: ${validEntries.length}/${data.length}`
    );
  }
  
  return validEntries;
}

/**
 * Valida se um ID de aba é válido
 * 
 * Type guard robusto que valida IDs de abas para prevenir ataques de injeção
 * e garantir consistência nos dados.
 * 
 * @param id - ID a ser validado (pode ser de qualquer tipo)
 * @returns true se o ID é válido, false caso contrário
 * 
 * @remarks
 * Validações realizadas:
 * - Deve ser uma string
 * - Não pode estar vazio
 * - Comprimento entre 1 e 100 caracteres
 * - Apenas caracteres alfanuméricos e hífens (a-z, A-Z, 0-9, -)
 * - Previne XSS e injeção de código
 * 
 * @example
 * ```typescript
 * if (isValidTabId(id)) {
 *   switchToTab(id);
 * } else {
 *   console.error('ID de aba inválido:', id);
 * }
 * ```
 */
export function isValidTabId(id: unknown): id is string {
  if (typeof id !== 'string') {
    return false;
  }
  
  if (id.length === 0 || id.length > 100) {
    return false;
  }
  
  // Apenas alfanuméricos e hífens
  const TAB_ID_PATTERN = /^[a-zA-Z0-9-]+$/;
  return TAB_ID_PATTERN.test(id);
}

/**
 * Valida se uma URL é válida
 * 
 * Type guard que valida se uma string é uma URL HTTP/HTTPS válida.
 * 
 * @param url - URL a ser validada (pode ser de qualquer tipo)
 * @returns true se a URL é válida, false caso contrário
 * 
 * @remarks
 * Validações realizadas:
 * - Deve ser uma string
 * - Deve começar com http:// ou https://
 * - Comprimento mínimo de 10 caracteres
 * - Comprimento máximo de 2048 caracteres
 * 
 * @example
 * ```typescript
 * if (isValidUrl(url)) {
 *   loadUrl(url);
 * } else {
 *   console.error('URL inválida:', url);
 * }
 * ```
 */
export function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string') {
    return false;
  }
  
  if (url.length < 10 || url.length > 2048) {
    return false;
  }
  
  const URL_PATTERN = /^https?:\/\/.+/;
  return URL_PATTERN.test(url);
}

/**
 * Valida se uma chave de configuração é válida
 * 
 * Type guard que valida chaves de configuração para prevenir injeção SQL
 * e garantir consistência.
 * 
 * @param key - Chave a ser validada (pode ser de qualquer tipo)
 * @returns true se a chave é válida, false caso contrário
 * 
 * @remarks
 * Validações realizadas:
 * - Deve ser uma string
 * - Não pode estar vazia após trim
 * - Comprimento máximo de 100 caracteres
 * - Apenas caracteres alfanuméricos, hífens e underscores
 * 
 * @example
 * ```typescript
 * if (isValidSettingKey(key)) {
 *   const value = await getSetting(key);
 * } else {
 *   throw new Error('Chave de configuração inválida');
 * }
 * ```
 */
export function isValidSettingKey(key: unknown): key is string {
  if (typeof key !== 'string') {
    return false;
  }
  
  const trimmed = key.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return false;
  }
  
  // Apenas alfanuméricos, hífens e underscores
  const KEY_PATTERN = /^[a-zA-Z0-9_-]+$/;
  return KEY_PATTERN.test(trimmed);
}

/**
 * Valida se um ID de bookmark é válido
 * 
 * Type guard que valida IDs de bookmarks (UUIDs).
 * 
 * @param id - ID a ser validado (pode ser de qualquer tipo)
 * @returns true se o ID é válido, false caso contrário
 * 
 * @remarks
 * Validações realizadas:
 * - Deve ser uma string
 * - Não pode estar vazia
 * - Comprimento entre 1 e 100 caracteres
 * - Formato UUID v4 (opcional, aceita outros formatos também)
 * 
 * @example
 * ```typescript
 * if (isValidBookmarkId(id)) {
 *   removeBookmark(id);
 * } else {
 *   console.error('ID de bookmark inválido:', id);
 * }
 * ```
 */
export function isValidBookmarkId(id: unknown): id is string {
  if (typeof id !== 'string') {
    return false;
  }
  
  if (id.length === 0 || id.length > 100) {
    return false;
  }
  
  // Aceita UUIDs e outros formatos alfanuméricos com hífens
  const ID_PATTERN = /^[a-zA-Z0-9-]+$/;
  return ID_PATTERN.test(id);
}
