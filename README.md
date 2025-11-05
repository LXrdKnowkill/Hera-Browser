# Hera Browser

A modern, feature-rich web browser built with Electron and TypeScript, designed for performance, security, and user experience.

![Version](https://img.shields.io/badge/version-2.0.5-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Electron](https://img.shields.io/badge/Electron-38.4.0-47848F.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)

## Overview

Hera Browser is a Chromium-based browser built on Electron, offering a clean and efficient browsing experience with advanced features like intelligent bookmarks, history management, download handling, and in-page search capabilities.

## Key Features

### Core Functionality
- **Multi-Tab Management** - Advanced tab system with session persistence
- **Bookmark System** - Hierarchical organization with folder support
- **Smart History** - Efficient search and navigation through browsing history
- **Download Manager** - Visual notifications and complete download management
- **Find in Page** - Real-time search with result navigation (v2.0.5)
- **Developer Tools** - Integrated DevTools accessible via F12
- **Modern UI** - Dark theme with smooth animations and transitions

### Find in Page (v2.0.5)
The latest addition to Hera Browser provides comprehensive in-page search functionality:

- **Real-time Search** - Results appear as you type with 150ms debounce optimization
- **Result Counter** - Displays "X of Y" matches found
- **Navigation Controls** - Previous/next buttons and keyboard shortcuts (Enter/Shift+Enter)
- **Visual Feedback** - Red border indicator when no results are found
- **Tab Isolation** - Each tab maintains its own independent search state
- **State Persistence** - Search state is preserved when switching between tabs
- **Universal Support** - Works on both external websites and internal pages (hera://)
- **Circular Navigation** - Seamlessly cycles from last to first result
- **Auto-scroll** - Automatically scrolls to visible results

### Bookmarks & Favorites
- Visual favorites bar with quick access to saved sites
- Folder-based organization for better management
- Real-time updates when adding or removing bookmarks
- Favicon display for easy site identification

### History & Downloads
- Dedicated pages accessible via `hera://history` and `hera://downloads`
- Real-time search and filtering capabilities
- Date-based grouping for history entries
- Progress tracking and file management for downloads
- Toast notifications for download events

### Security
- Compartmentalized preload scripts for enhanced security
- Context isolation between trusted and untrusted code
- Principle of least privilege implementation
- External sites cannot access privileged browser APIs

## Screenshots

_Coming soon..._

## Technology Stack

- **Electron** 38.4.0 - Cross-platform desktop application framework
- **TypeScript** 4.5.4 - Strongly typed programming language (100% type coverage)
- **SQLite3** - Embedded database for history, bookmarks, and settings
- **Webpack** - Module bundler and build system
- **Electron Forge** - Build and distribution tooling

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Development Setup

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/hera-browser.git
cd hera-browser
```

2. Install dependencies
```bash
npm install
```

3. Rebuild native modules (required for SQLite3)
```bash
npm run rebuild
```

4. Start the development server
```bash
npm start
```

## Building for Production

### Package the application
```bash
npm run package
```

### Create distributable installer
```bash
npm run make
```

The built application will be available in the `out` directory.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close current tab |
| `Ctrl+R` / `F5` | Reload page |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+1-9` | Jump to tab number N |
| `Ctrl+D` | Add/remove bookmark |
| `Ctrl+L` | Focus address bar |
| `Ctrl+F` | Find in page |
| `Enter` | Next search result |
| `Shift+Enter` | Previous search result |
| `Ctrl+H` | Open history |
| `Ctrl+J` | Open downloads |
| `F12` | Toggle DevTools |
| `Esc` | Close modals/panels/search |

## Internal URLs

Hera Browser provides internal pages accessible via the `hera://` protocol:

| URL | Description |
|-----|-------------|
| `hera://new-tab` | New tab page |
| `hera://settings` | Browser settings |
| `hera://history` | Browsing history |
| `hera://downloads` | Download manager |

## Project Structure

```
hera-browser/
├── src/
│   ├── index.ts              # Main process (Electron)
│   ├── renderer.ts           # Renderer process (UI logic)
│   ├── preload-ui.ts         # Privileged preload (internal pages)
│   ├── preload-web.ts        # Limited preload (external sites)
│   ├── database.ts           # SQLite operations
│   ├── index.html            # Main interface
│   ├── index.css             # Styles
│   ├── settings.html/js/css  # Settings page
│   ├── new-tab.html/css      # New tab page
│   ├── history.html/js/css   # History page
│   ├── downloads.html/js/css # Downloads page
│   ├── menu.html/js/css      # Context menu
│   └── types/                # TypeScript definitions
│       ├── api.types.ts
│       ├── database.types.ts
│       ├── ui.types.ts
│       ├── ipc.types.ts
│       ├── guards.ts
│       └── __tests__/        # Type tests
├── .webpack/                 # Build output
├── out/                      # Distribution builds
└── package.json
```

## Security

Hera Browser implements multiple security layers:

- **Preload Compartmentalization** - External sites cannot access privileged browser APIs
- **Context Isolation** - Complete isolation between processes
- **Type Safety** - 100% TypeScript with compile-time validation
- **Data Validation** - Type guards for database operations
- **Least Privilege Principle** - Each component has only necessary permissions

See [SECURITY_PRELOAD.md](SECURITY_PRELOAD.md) for detailed information.

## Changelog

### v2.0.5 (2025-11-05)
- Find in Page functionality with Ctrl+F
- Real-time search with debounce optimization
- Result counter and navigation controls
- Tab isolation and state persistence
- Performance improvements and memory leak fixes

### v2.0.4 (2025-11-04)
- Complete UI/UX refinement
- CSS variable system (30+ variables)
- Enhanced animations and transitions
- Improved hover effects
- Code cleanup and optimization

### v2.0.3 (2025-11-03)
- Fixed hera:// protocol handling
- Implemented persistent session for WhatsApp Web
- Optimized internal navigation
- Global User Agent configuration

### v2.0.2 (2025-11-03)
- Functional favorites bar with visualization
- Modern design with favicons
- Real-time updates

### v2.0.1 (2025-11-03)
- Critical security fix: Preload compartmentalization
- Dedicated history page (hera://history)
- Dedicated downloads page (hera://downloads)
- Download notification system
- 100% TypeScript type coverage

### v2.0.0 (2025)
- Complete bookmark system with folders
- Smart omnibox with suggestions
- Advanced keyboard shortcuts
- Tab persistence
- Modern interface

For complete version history, see [CHANGELOG.md](CHANGELOG.md).

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -m 'Add NewFeature'`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

### Development Guidelines

- Maintain 100% TypeScript type coverage
- Follow existing code patterns and conventions
- Add type tests when applicable
- Document new features thoroughly
- Test across different scenarios before submitting

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Author

**Knowkill**

GitHub: [@LXrdKnowkill](https://github.com/LXrdKnowkill)

## Acknowledgments

- Electron team for the framework
- Open source community
- All contributors

## Additional Documentation

- [SECURITY_PRELOAD.md](SECURITY_PRELOAD.md) - Security documentation
- [TYPE_TESTS_EXPLAINED.md](TYPE_TESTS_EXPLAINED.md) - Type testing explanation
- [DOWNLOAD_NOTIFICATIONS.md](DOWNLOAD_NOTIFICATIONS.md) - Notification system
- [CHANGELOG.md](CHANGELOG.md) - Complete version history

---

Part of the HikariSystem ecosystem
