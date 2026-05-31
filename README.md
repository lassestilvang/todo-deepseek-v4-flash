# Daily Planner

A warm, beautiful daily task planner built with Next.js and SQLite.

Built with care for performance, accessibility, and delightful user experience.

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Database:** SQLite via better-sqlite3 (WAL mode, memory-mapped I/O)
- **Styling:** Tailwind CSS v4 with OKLCH color system
- **Font:** Geist (Vercel's typeface)
- **Icons:** Lucide React
- **UI:** Radix UI primitives for accessible dialogs, checkboxes, etc.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to today's tasks.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Create new task |
| `Q` / `A` | Focus quick add |
| `⌘K` | Toggle command palette |
| `1`-`4` | Switch views (Today, 7d, Upcoming, All) |
| `?` | Show keyboard shortcuts help |
| `ESC` | Close dialogs / search |

## Features

- **Views:** Today, Next 7 Days, Upcoming, All Tasks
- **Lists & Labels:** Organize tasks with custom lists and color-coded labels
- **Quick Add:** Fast task creation from any view
- **Command Palette:** ⌘K for keyboard-driven navigation and search
- **Dark Mode:** Automatic or manual theme switching
- **Recurring Tasks:** Daily, weekly, monthly, and yearly recurrence
- **Subtasks:** Break down tasks with checkable subtasks
- **Optimistic UI:** Instant feedback with automatic rollback on failure
- **Offline-first:** SQLite database, no external API dependencies
