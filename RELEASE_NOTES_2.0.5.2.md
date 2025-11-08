# Hera Browser v2.0.5.2 - Hotfix Release

## 🐛 Critical Bug Fixes

### Database Initialization in Development Mode
Fixed a critical issue where the database would fail to initialize in development mode, causing all database-dependent features to fail.

**What was fixed:**
- ✅ Database now initializes correctly in dev mode
- ✅ Fixed "Cannot find module 'undefinedbuild/Release/better_sqlite3.node'" error
- ✅ Added workaround for webpack-asset-relocator-loader configuration issue
- ✅ All features now work properly: history, bookmarks, downloads, settings, tab persistence

**Technical Details:**
The webpack-asset-relocator-loader wasn't setting `__webpack_require__.ab` in development mode, causing better-sqlite3 to fail loading its native module. Added a manual workaround to set the asset base path before importing the module.

## 🔧 Code Quality Improvements

### ESLint Warnings Fixed
- Fixed `import/no-named-as-default` warning by renaming Database import
- Fixed `import/no-duplicates` warning by removing duplicate imports
- Improved code consistency and maintainability

## 📊 Testing

- ✅ Full functional testing completed
- ✅ All features verified working
- ✅ No regressions detected
- ✅ Tab management, navigation, history, bookmarks, downloads, and settings all functional

## 📦 Installation

Download the appropriate installer for your platform from the assets below.

## 🔄 Upgrade Notes

This is a hotfix release. Simply install over your existing version - all your data will be preserved.

---

**Full Changelog**: https://github.com/lxrdknowkill/hera-browser/blob/main/CHANGELOG.md
