/**
 * Constantes globais do Hera Browser
 * Centraliza magic numbers e valores de configuração
 */

// UI Heights (pixels)
export const TAB_BAR_HEIGHT = 40;
export const NAV_BAR_HEIGHT = 50;
export const FAVORITES_BAR_HEIGHT = 40;
export const FIND_BAR_HEIGHT = 50;

// Timing (milliseconds)
export const FIND_DEBOUNCE_MS = 150;
export const TAB_SWITCH_DELAY_MS = 50;
export const DOWNLOAD_PANEL_AUTO_CLOSE_MS = 3000;
export const DATABASE_RETRY_DELAY_MS = 1000;
export const FAVORITES_RETRY_DELAY_MS = 200;

// Limits
export const MAX_TAB_ID_LENGTH = 100;
export const MAX_HISTORY_ENTRIES = 1000;
export const MAX_DOWNLOAD_RETRIES = 2;
export const MAX_FAVORITES_RETRIES = 2;

// Regex Patterns
export const TAB_ID_PATTERN = /^[a-zA-Z0-9-]+$/;
export const URL_PATTERN = /^https?:\/\/.+/;

// Default Values
export const DEFAULT_SEARCH_ENGINE = 'google';
export const DEFAULT_THEME = 'dark';
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
