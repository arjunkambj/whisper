# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Whisper is a full-stack audio transcription app. Users upload audio/video files, which are transcribed via OpenAI's Whisper model, stored in Convex, and displayed with timestamped segments that users can edit.

## Rules

- Prefer functional programming patterns. Avoid explicit return types unless necessary.
- Be concise in code, but thorough in planning.
- Use Bun as the package manager — never use pnpm, npm, or yarn.
- Do not run `bun dev` or `bunx convex dev` — they are always running in the user's terminal.
- Always use the CLI to add shadcn components: `bunx shadcn add <component>`.
- This is a greenfield project with no users or existing data. Schema, functions, and architecture can be freely modified. Remove legacy logic, duplicate checks, or redundant functions when found.

## Commands

- `bun dev` — Start Next.js dev server
- `bunx convex dev` — Start Convex backend dev server (run alongside `bun dev`)
- `bun run build` — Production build
- `bun run lint` — Lint with Biome (`biome check`)
- `bun run format` — Auto-format with Biome (`biome format --write`)

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript (strict mode)
- **Backend:** Convex (real-time database, server functions, auto-generated types)
- **AI:** Vercel AI SDK + `@ai-sdk/openai` for Whisper transcription
- **Styling:** Tailwind CSS v4, shadcn/ui (base-maia style, Tabler icons), CVA for variants
- **Linting/Formatting:** Biome (replaces ESLint/Prettier), 2-space indent, auto-organized imports
- **Package Manager:** Bun

## Architecture

### Data Flow

1. Client uploads audio file via drag-and-drop (`upload-zone.tsx`)
2. `POST /api/ai` validates the file (25MB max, supported audio/video types) and calls OpenAI Whisper
3. Transcription result (text, timed segments, language, duration) is saved to Convex via mutation
4. Client uses Convex real-time hooks (`useQuery`, `useMutation`) to display and edit transcriptions
5. Individual transcriptions viewable/editable at `/transcription/[id]`

### Key Directories

- `src/app/api/ai/route.ts` — Whisper transcription API endpoint
- `src/app/transcription/[id]/page.tsx` — Transcription detail/edit page
- `src/components/` — App components (upload-zone, transcription-history, upload-progress)
- `src/components/ui/` — shadcn/ui primitives (do not edit manually; use `bunx shadcn add`)
- `convex/schema.ts` — Database schema (transcriptions table with segments)
- `convex/transcriptions.ts` — Convex queries and mutations (list, save, getById, update, remove)
- `convex/_generated/` — Auto-generated Convex types (do not edit)

### Conventions

- Path alias: `@/*` maps to `./src/*`
- Client components use `"use client"` directive; default is Server Components
- `cn()` utility from `@/lib/utils` for merging Tailwind classes (clsx + tailwind-merge)
- React Compiler is enabled (`babel-plugin-react-compiler`) — avoid manual memoization
- Toast notifications via Sonner
- Theme support via `next-themes`

## Environment Variables

Required in `.env.local`:
- `CONVEX_DEPLOYMENT` — Convex deployment identifier
- `NEXT_PUBLIC_CONVEX_URL` — Convex backend URL (public, used by client)
- OpenAI API key configured in Convex environment settings
