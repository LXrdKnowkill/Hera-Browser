/**
 * Entrada de histórico de navegação
 * 
 * Representa uma visita a uma URL no histórico do navegador.
 * O histórico é usado para sugestões de navegação e para rastrear sites visitados.
 * 
 * @remarks
 * - Entradas são ordenadas por timestamp (mais recentes primeiro)
 * - URLs duplicadas incrementam o visit_count ao invés de criar novas entradas
 * - O título é capturado no momento da visita e pode estar desatualizado
 * 
 * @example
 * ```typescript
 * const entry: HistoryEntry = {
 *   id: 1,
 *   url: 'https://github.com',
 *   title: 'GitHub',
 *   timestamp: Date.now(),
 *   visit_count: 5
 * };
 * ```
 */
export interface HistoryEntry {
  /**
   * ID único da entrada (gerado automaticamente pelo banco de dados)
   * 
   * @remarks
   * Opcional ao criar uma nova entrada, mas sempre presente ao ler do banco
   */
  id?: number;
  
  /** URL completa visitada (deve incluir protocolo) */
  url: string;
  
  /** Título da página no momento da visita */
  title: string;
  
  /**
   * Timestamp Unix em milissegundos da visita
   * 
   * @remarks
   * Use Date.now() para obter o timestamp atual
   */
  timestamp: number;
  
  /**
   * Número de vezes que esta URL foi visitada
   * 
   * @remarks
   * Opcional ao criar, incrementado automaticamente em visitas subsequentes
   * @defaultValue 1
   */
  visit_count?: number;
}

/**
 * Favorito (bookmark)
 * 
 * Representa um site salvo pelo usuário para acesso rápido.
 * Bookmarks podem estar organizados em pastas através do campo folder_id.
 * 
 * @remarks
 * - Bookmarks são ordenados por position dentro de cada pasta
 * - O campo url é opcional para permitir separadores visuais
 * - Timestamps são em milissegundos (Unix epoch)
 * - IDs são UUIDs gerados pelo sistema
 * 
 * @example
 * ```typescript
 * const bookmark: Bookmark = {
 *   id: 'uuid-v4-string',
 *   url: 'https://github.com',
 *   title: 'GitHub',
 *   favicon: 'data:image/png;base64,...',
 *   folder_id: 'work-folder-uuid',
 *   position: 0,
 *   created_at: Date.now(),
 *   updated_at: Date.now()
 * };
 * ```
 */
export interface Bookmark {
  /**
   * ID único do bookmark (UUID v4)
   * 
   * @remarks
   * Gerado automaticamente ao criar um novo bookmark
   */
  id: string;
  
  /**
   * URL do site favorito
   * 
   * @remarks
   * Opcional para permitir separadores visuais (bookmarks sem URL).
   * Quando presente, deve ser uma URL válida com protocolo.
   */
  url?: string;
  
  /** Título do bookmark exibido na UI */
  title: string;
  
  /**
   * URL do favicon em formato base64 ou caminho
   * 
   * @remarks
   * Opcional. Geralmente em formato data:image/png;base64,...
   * Se omitido, a UI pode exibir um ícone padrão
   */
  favicon?: string;
  
  /**
   * ID da pasta pai onde o bookmark está localizado
   * 
   * @remarks
   * - Opcional: undefined ou null indica que o bookmark está na raiz
   * - Deve corresponder ao ID de uma BookmarkFolder existente
   * - Permite organização hierárquica de bookmarks
   */
  folder_id?: string;
  
  /**
   * Posição do bookmark dentro da pasta (para ordenação)
   * 
   * @remarks
   * - Índice baseado em zero
   * - Usado para manter a ordem definida pelo usuário
   * - Bookmarks com position menor aparecem primeiro
   */
  position: number;
  
  /**
   * Timestamp Unix (ms) de criação
   * 
   * @remarks
   * Definido automaticamente ao criar o bookmark
   */
  created_at: number;
  
  /**
   * Timestamp Unix (ms) da última atualização
   * 
   * @remarks
   * Atualizado automaticamente quando o bookmark é modificado
   */
  updated_at: number;
}

/**
 * Pasta de favoritos
 * 
 * Organiza bookmarks em uma estrutura hierárquica.
 * Pastas podem conter outras pastas através do campo parent_id.
 * 
 * @remarks
 * - Permite estrutura de árvore com profundidade ilimitada
 * - Pastas são ordenadas por position dentro de cada nível
 * - Não há campo updated_at (pastas não são editadas, apenas criadas/deletadas)
 * 
 * @example
 * ```typescript
 * const rootFolder: BookmarkFolder = {
 *   id: 'uuid-v4-string',
 *   name: 'Trabalho',
 *   parent_id: undefined, // Pasta na raiz
 *   position: 0,
 *   created_at: Date.now()
 * };
 * 
 * const subFolder: BookmarkFolder = {
 *   id: 'uuid-v4-string-2',
 *   name: 'Projetos',
 *   parent_id: rootFolder.id, // Subpasta de "Trabalho"
 *   position: 0,
 *   created_at: Date.now()
 * };
 * ```
 */
export interface BookmarkFolder {
  /**
   * ID único da pasta (UUID v4)
   * 
   * @remarks
   * Gerado automaticamente ao criar uma nova pasta
   */
  id: string;
  
  /** Nome da pasta exibido na UI */
  name: string;
  
  /**
   * ID da pasta pai onde esta pasta está localizada
   * 
   * @remarks
   * - Opcional: undefined ou null indica que a pasta está na raiz
   * - Deve corresponder ao ID de outra BookmarkFolder existente
   * - Permite estrutura hierárquica de pastas (árvore)
   * - Cuidado com referências circulares (não validado automaticamente)
   */
  parent_id?: string;
  
  /**
   * Posição da pasta dentro da pasta pai (para ordenação)
   * 
   * @remarks
   * - Índice baseado em zero
   * - Usado para manter a ordem definida pelo usuário
   * - Pastas com position menor aparecem primeiro
   */
  position: number;
  
  /**
   * Timestamp Unix (ms) de criação
   * 
   * @remarks
   * Definido automaticamente ao criar a pasta.
   * Não há campo updated_at pois pastas não são editadas após criação.
   */
  created_at: number;
}

/**
 * Estado de uma aba para persistência
 * 
 * Usado para salvar e restaurar o estado das abas entre sessões.
 * Permite que o navegador reabra as abas que estavam abertas quando foi fechado.
 * 
 * @remarks
 * - Salvo automaticamente quando o navegador é fechado
 * - Restaurado automaticamente quando o navegador é aberto
 * - Apenas uma aba pode ter active = true por vez
 * - Abas são ordenadas por position na barra de abas
 * 
 * @example
 * ```typescript
 * const tabState: TabState = {
 *   id: 'tab-uuid',
 *   url: 'https://github.com',
 *   title: 'GitHub',
 *   favicon: 'data:image/png;base64,...',
 *   position: 0,
 *   active: true
 * };
 * ```
 */
export interface TabState {
  /**
   * ID único da aba
   * 
   * @remarks
   * Deve corresponder ao ID da aba no BrowserView do Electron
   */
  id: string;
  
  /**
   * URL atual da aba
   * 
   * @remarks
   * URL completa incluindo protocolo. Usada para restaurar a página ao reabrir.
   */
  url: string;
  
  /** Título da página exibido na aba */
  title: string;
  
  /**
   * URL do favicon em formato base64 ou caminho
   * 
   * @remarks
   * Opcional. Se omitido, o favicon será recarregado ao restaurar a aba.
   */
  favicon?: string;
  
  /**
   * Posição da aba na barra de abas (para ordenação)
   * 
   * @remarks
   * - Índice baseado em zero
   * - Usado para restaurar a ordem das abas
   * - Abas com position menor aparecem à esquerda
   */
  position: number;
  
  /**
   * Indica se esta é a aba ativa (visível)
   * 
   * @remarks
   * - Apenas uma aba deve ter active = true por vez
   * - A aba ativa é restaurada como visível ao reabrir o navegador
   */
  active: boolean;
}
