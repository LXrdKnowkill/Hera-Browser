/**
 * Informações básicas de uma aba
 * 
 * Usado para comunicar informações essenciais sobre uma aba
 * entre o processo principal e o renderer.
 */
export interface TabInfo {
  /** ID único da aba */
  id: string;
  /** Título da página */
  title: string;
  /** URL atual */
  url: string;
  /** URL do favicon */
  favicon?: string;
}

/**
 * Informações de atualização de aba (campos opcionais)
 * 
 * Usado para notificar mudanças parciais no estado de uma aba.
 * Apenas os campos que mudaram precisam ser incluídos.
 */
export interface TabUpdateInfo {
  /** Novo título da página */
  title?: string;
  /** Nova URL */
  url?: string;
  /** Novo favicon */
  favicon?: string;
  /** Estado de carregamento */
  loading?: boolean;
}

/**
 * Estado de navegação (botões back/forward)
 * 
 * Indica se os botões de navegação devem estar habilitados ou desabilitados.
 */
export interface NavigationState {
  /** Se é possível voltar na história de navegação */
  canGoBack: boolean;
  /** Se é possível avançar na história de navegação */
  canGoForward: boolean;
}

/**
 * Tipos de sugestões do omnibox
 */
export type OmniboxSuggestionType = 'history' | 'bookmark' | 'search';

/**
 * Sugestão do omnibox
 * 
 * Representa uma sugestão exibida quando o usuário digita na barra de endereços.
 * Pode ser do histórico, dos favoritos, ou uma sugestão de busca.
 */
export interface OmniboxSuggestion {
  /** Tipo da sugestão */
  type: OmniboxSuggestionType;
  /** Título ou texto da sugestão */
  title: string;
  /** URL associada à sugestão */
  url: string;
  /** Favicon da sugestão (se disponível) */
  favicon?: string;
}

/**
 * Informações de download
 * 
 * Rastreia o estado e progresso de um download.
 */
export interface DownloadInfo {
  /** ID único do download */
  id: string;
  /** Nome do arquivo sendo baixado */
  filename: string;
  /** Tamanho total do arquivo em bytes */
  totalBytes: number;
  /** Bytes recebidos até o momento */
  receivedBytes?: number;
  /** Estado atual do download */
  state?: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  /** Caminho completo do arquivo baixado (disponível quando completo) */
  path?: string;
}
