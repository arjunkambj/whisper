# Whisper

A full-stack audio transcription app built with Next.js and OpenAI's Whisper model. Upload audio or video files, get timestamped transcriptions, and edit them in-place.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Convex** — real-time backend database and server functions
- **Vercel AI SDK** + **OpenAI Whisper** — audio transcription
- **Tailwind CSS v4** + **shadcn/ui** — styling and components
- **Biome** — linting and formatting
- **Bun** — package manager and runtime

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- A [Convex](https://convex.dev) account with a project set up
- An OpenAI API key (configured in your Convex dashboard)

### Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a `.env.local` file with your Convex config:

   ```
   CONVEX_DEPLOYMENT=<your-convex-deployment-id>
   NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
   ```

3. Start the Convex dev server and Next.js dev server in separate terminals:

   ```bash
   bunx convex dev
   ```

   ```bash
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. Upload an audio or video file (MP3, WAV, MP4, WEBM, OGG, FLAC, M4A — up to 25MB)
2. The file is sent to OpenAI's Whisper API for transcription
3. The result (text, timed segments, language, duration) is stored in Convex
4. View, edit, or delete transcriptions from the dashboard

## Project Structure

```
src/
  app/
    api/ai/route.ts          # Whisper transcription endpoint
    transcription/[id]/       # Transcription detail/edit page
    page.tsx                  # Home — upload and history
  components/
    ui/                       # shadcn/ui primitives
    upload-zone.tsx           # Drag-and-drop file upload
    transcription-history.tsx # Transcription list
  lib/
    utils.ts                  # cn() helper, utilities
    types.ts                  # Shared TypeScript types
convex/
  schema.ts                   # Database schema
  transcriptions.ts           # Queries and mutations
```

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start Next.js dev server |
| `bunx convex dev` | Start Convex dev server |
| `bun run build` | Production build |
| `bun run lint` | Lint with Biome |
| `bun run format` | Auto-format with Biome |
