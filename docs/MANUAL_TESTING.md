# Manual Testing Guide

This document describes how to manually test the Browser IDE application. It complements the automated test suite (634+ unit/integration tests, Playwright E2E tests) by covering scenarios that require visual inspection, real user interaction, or cross-browser verification.

---

## Prerequisites

- Node.js 22+ and pnpm 8.14+
- A modern browser (Chrome 90+, Firefox 90+, Safari 16.4+, or Edge 90+)
- The dev server running: `pnpm dev` (opens at `http://localhost:5173`)

## Test Environment Setup

1. `pnpm install` to install dependencies.
2. `pnpm dev` to start the development server.
3. Open `http://localhost:5173` in your browser.
4. Open browser DevTools (F12) to monitor console errors during testing.

---

## Test Case Reference

All structured manual test cases are in [manual-test-cases.csv](./manual-test-cases.csv). The CSV uses these columns:

| Column | Description |
|--------|-------------|
| ID | Unique test case identifier (e.g., TC-001) |
| Portal | "Browser IDE" (single portal) |
| Module | Feature area (File Explorer, Editor, Terminal, Git, AI, Help, etc.) |
| Test Case | Short description of what is being tested |
| Pre Conditions | What must be true before running the test |
| Steps | Numbered steps to execute |
| Expected Result | What should happen |
| Priority | P1 (critical), P2 (important), P3 (nice to have) |

---

## Quick Smoke Test (5 minutes)

Run these checks first to verify the app is fundamentally working:

1. App loads without console errors
2. File explorer is visible with default files
3. Clicking a file opens it in the editor with syntax highlighting
4. Terminal opens and accepts a command (`ls`)
5. Help panel opens and shows documentation
6. Command Palette opens with Ctrl+Shift+P

---

## Module-by-Module Testing

### File Explorer
- Create, rename, delete files and folders
- Verify file icons match extensions
- Confirm context menus appear on right-click

### Editor
- Verify syntax highlighting for .ts, .tsx, .json, .md files
- Test multi-tab editing (open 3+ files)
- Verify Ctrl+S saves (modified indicator disappears)
- Test Ctrl+F find/replace

### Terminal
- Open terminal with Ctrl+`
- Run `ls`, `pwd`, `echo hello`
- Verify Ctrl+C interrupts running processes
- Test multiple terminal tabs

### Git Integration
- Open Git panel with Ctrl+Shift+G
- Verify status shows after cloning a repo
- Stage, unstage, and commit changes
- Switch between Changes, History, Branches, Stash tabs

### AI Assistant
- Open AI panel from bottom tab bar
- Verify API key input in Settings
- Send a test message (requires valid API key)

### Help Panel
- Open help from bottom tab bar
- Navigate through all 10 sections
- Test search functionality
- Verify mobile layout (resize window < 768px)

### Responsive Design
- Test at 375px (mobile), 768px (tablet), 1280px (desktop)
- Verify bottom tab bar swipe gestures on mobile
- Verify sidebar collapses on mobile

---

## Reporting Issues

When reporting a failed manual test:
1. Note the Test Case ID from the CSV
2. Include browser name and version
3. Attach a screenshot if relevant
4. Include any console errors from DevTools

---

**Last Updated:** February 2026
