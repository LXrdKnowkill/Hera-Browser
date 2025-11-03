/**
 * Central export file for all types
 * 
 * This file re-exports all types from the different type modules,
 * organized by category for easy importing.
 */

// API Types
export type { HeraAPI } from './api.types';

// Database Types
export type {
  HistoryEntry,
  Bookmark,
  BookmarkFolder,
  TabState
} from './database.types';

// UI Types
export type {
  TabInfo,
  TabUpdateInfo,
  NavigationState,
  OmniboxSuggestion,
  OmniboxSuggestionType,
  DownloadInfo
} from './ui.types';

// IPC Callback Types
export type {
  TabCreatedCallback,
  TabSwitchedCallback,
  TabUpdatedCallback,
  TabClosedCallback,
  TabLoadingCallback,
  UIVisibilityCallback,
  WindowMaximizedCallback,
  GenericCallback,
  DownloadStartedCallback,
  DownloadProgressCallback,
  DownloadCompleteCallback
} from './ipc.types';

// Type Guards
export {
  isBookmark,
  isBookmarkFolder,
  isHistoryEntry,
  validateBookmarks,
  validateBookmarkFolders,
  validateHistoryEntries
} from './guards';
