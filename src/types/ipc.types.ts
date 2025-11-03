import { TabInfo, TabUpdateInfo, DownloadInfo } from './ui.types';

/**
 * Callback para evento de aba criada
 * 
 * Chamado quando uma nova aba é criada no navegador.
 */
export type TabCreatedCallback = (tabInfo: TabInfo) => void;

/**
 * Callback para evento de troca de aba
 * 
 * Chamado quando o usuário muda para uma aba diferente.
 */
export type TabSwitchedCallback = (id: string, url: string) => void;

/**
 * Callback para evento de atualização de aba
 * 
 * Chamado quando informações de uma aba mudam (título, URL, favicon, etc).
 */
export type TabUpdatedCallback = (id: string, tabInfo: TabUpdateInfo) => void;

/**
 * Callback para evento de aba fechada
 * 
 * Chamado quando uma aba é fechada pelo usuário.
 */
export type TabClosedCallback = (id: string) => void;

/**
 * Callback para evento de loading de aba
 * 
 * Chamado quando uma aba inicia ou termina o carregamento de uma página.
 */
export type TabLoadingCallback = (id: string, isLoading: boolean) => void;

/**
 * Callback para evento de visibilidade da UI
 * 
 * Chamado quando elementos da UI devem ser mostrados ou ocultados.
 */
export type UIVisibilityCallback = (visible: boolean) => void;

/**
 * Callback para evento de status de maximização
 * 
 * Chamado quando a janela é maximizada ou restaurada.
 */
export type WindowMaximizedCallback = (isMaximized: boolean) => void;

/**
 * Callback genérico para eventos customizados
 * 
 * Usado para eventos IPC que não têm uma assinatura específica definida.
 */
export type GenericCallback = (...args: unknown[]) => void;

/**
 * Callback para evento de download iniciado
 * 
 * Chamado quando um novo download é iniciado.
 * Inclui apenas as informações iniciais do download.
 */
export type DownloadStartedCallback = (data: Pick<DownloadInfo, 'id' | 'filename' | 'totalBytes'>) => void;

/**
 * Callback para evento de progresso de download
 * 
 * Chamado periodicamente durante o download para reportar progresso.
 * Inclui apenas o ID e os bytes recebidos.
 */
export type DownloadProgressCallback = (data: Pick<DownloadInfo, 'id' | 'receivedBytes'>) => void;

/**
 * Callback para evento de download completo
 * 
 * Chamado quando um download é finalizado (com sucesso, cancelado, ou interrompido).
 * Inclui o estado final e o caminho do arquivo.
 */
export type DownloadCompleteCallback = (data: Required<Pick<DownloadInfo, 'id' | 'state' | 'path'>>) => void;
