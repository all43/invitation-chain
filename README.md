# Invitation Chain

A full-stack web app for visualizing and moderating hierarchical user invitation networks. Built as a portfolio project to demonstrate clean full-stack architecture with an interactive D3 tree visualization.

![Tech Stack](https://img.shields.io/badge/Vue_3-4FC08D?style=flat&logo=vue.js&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Tech Stack](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tech Stack](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)

## What it does

Track who invited whom. Each user in the system was either a root entry or was invited by someone else, forming a tree. You can:

- Add root users or invite new users under any existing one
- Visualize the full invitation hierarchy as an interactive, zoomable/pannable D3 tree
- Click any node to inspect their details and full ancestry chain
- Ban individual users or bulk-ban all descendants of a node
- Optionally restrict bans to users invited after a specific date
- Unban users and their descendants
- Seed the database with demo data or clear it entirely

## Tech Stack

**Backend**
- Node.js + Express — REST API
- SQLite via `better-sqlite3` — embedded database with WAL mode
- Recursive CTEs for efficient ancestor/descendant traversal

**Frontend**
- Vue 3 (Composition API, `<script setup>`)
- D3.js — tree layout, zoom, and pan
- Vite — dev server with proxy to backend

**Shared**
- TypeScript end-to-end with shared types across lib, server, and web
- npm workspaces monorepo

## Project Structure

```
invitation-chain/
├── apps/
│   ├── server/          # Express API (port 3001)
│   └── web/             # Vue 3 frontend (port 5173 in dev)
├── packages/
│   └── lib/             # Core InvitationChain class, DB layer, types
└── data/                # SQLite database file
```

The core logic lives in `packages/lib` as a standalone class — fully testable independent of HTTP or UI concerns.

## Getting Started

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

**Other commands:**

```bash
npm run build   # compile all packages
npm run test    # run unit tests (vitest)
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | All users |
| GET | `/api/tree` | Full tree structure |
| POST | `/api/users` | Add a root user |
| POST | `/api/invite` | Invite a user under a parent |
| POST | `/api/ban/:id` | Ban a user |
| POST | `/api/unban/:id` | Unban a user |
| POST | `/api/ban-descendants/:id` | Ban all descendants |
| POST | `/api/unban-descendants/:id` | Unban all descendants |
| GET | `/api/ancestors/:id` | Get ancestry chain |
| POST | `/api/seed` | Seed demo data |
| POST | `/api/reset` | Clear the database |

## Key Design Decisions

- **Soft deletes** — users are flagged `is_banned` rather than deleted, preserving the invitation tree structure and audit trail
- **Recursive CTEs** — ancestor and descendant queries use SQL CTEs instead of application-level tree walks, keeping bulk operations fast
- **Shared types** — `User`, `TreeNode`, and `BanResult` are defined once in `packages/lib` and consumed by both the API and frontend, preventing drift
- **Client-side tree building** — the flat user list is assembled into a tree on the frontend, keeping the API simple and the visualization state easy to manage
