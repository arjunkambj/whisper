# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages and API routes. `src/app/api/ai/route.ts` handles transcription requests, and `src/app/transcription/[id]` contains per-transcription views.
- `src/components`: Feature components (upload, progress, history) plus shared UI primitives in `src/components/ui`.
- `src/lib`: Shared utilities and types (`format.ts`, `types.ts`, `utils.ts`).
- `convex`: Backend schema/functions (`schema.ts`, `transcriptions.ts`) and generated API/types in `convex/_generated` (treat generated files as read-only).
- `public`: Static assets served directly by Next.js.

## Build, Test, and Development Commands
- `bun run dev`: Start local development server (`http://localhost:3000`).
- `bun run build`: Create production build (includes type/lint-sensitive compile checks).
- `bun run check-types`: Run TypeScript type-checking (`tsc --noEmit`).
- `bun run start`: Run the production build locally.
- `bun run lint`: Run Biome checks across the repository.
- `bun run format`: Apply Biome formatting.
- `npx convex dev`: Run Convex locally and regenerate backend bindings while editing `convex/*`.

Important,
Prefer functional programming patterns, avoid explicit returns types unless you absolutely need to, and be concise in the code you write, but be through in your planning.

When installing packages, use the package manager for that language.

This is a brand-new project with no users and no existing database data.
You are free to modify the schema, functions, or architecture as needed to solve problems — there are no legacy constraints to consider.
If you encounter any legacy logic, duplicate checks, or redundant functions in the codebase, feel free to remove or refactor them as needed.

DONT DO PNPM DEV OR NPX CONVEX DEV BECAUSE IS ALWAYS RUNNING IN MY TERMINAL

-Always use Cli command to add shadcn compoents

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode and `@/*` path alias (see `tsconfig.json`).
- Formatting/linting: Biome (`biome.json`) with 2-space indentation and organized imports.
- Naming: `PascalCase` for React components/types, `camelCase` for functions/variables, `UPPER_SNAKE_CASE` for constants.
- Files: Prefer kebab-case for component files (for example, `upload-zone.tsx`); use route folders that mirror URL structure (for example, `transcription/[id]`).

## Testing Guidelines
- There is no dedicated test framework configured yet.
- Baseline validation before opening a PR: `bun run check-types`, `bun run lint`, and `bun run build`.
- For Convex changes, run `npx convex dev` and verify end-to-end behavior in the UI (upload, transcription creation, history retrieval).
- If adding tests, use `*.test.ts`/`*.test.tsx` naming and colocate near the feature or in a focused `src/__tests__` folder.

## Commit & Pull Request Guidelines
- Current history is minimal (`Initial commit from Create Next App`), so follow clear, imperative commit messages.
- Recommended commit style: concise subject with optional scope (example: `feat(upload): validate file type and size`).
- PRs should include: purpose, key changes, local verification steps, linked issue/task, and screenshots for UI changes.
- Keep PRs focused; split unrelated refactors into separate PRs.
