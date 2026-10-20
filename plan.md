# GentleBrief roadmap

Distraction-free daily audio digest. Visual system follows `design.md` (Construtivismo Dinâmico Tech): Oswald, charcoal, vermelho, azul, amarelo, geometric layout, light mode only. Pipeline stays fixture-backed when credentials are missing.

- [x] **Phase 1: Environment & Project Setup**
  - Define environment variables template in `.env.example`:
    - `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`
    - `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
    - `OPEN_AI_OR_GROQ_API_KEY` (Groq OpenAI-compatible endpoint, model `llama-3.3-70b-versatile`)
  - Verify shadcn/ui component installations (`button`, `card`, `badge`, `tabs`, `slider`, `skeleton`, `dialog`, `separator`, `scroll-area`, `avatar`, `sonner`, `progress`, `tooltip`).
  - Install `@browserbasehq/stagehand` for keyed scrapes.

- [x] **Phase 2: Types & Mock/Storage Layer**
  - Define TypeScript schemas (`types/digest.ts`):
    - `TopicSource`: ID, label, url, icon, enabled
    - `DigestItem`: id, title, summary, originalUrl, sourceName, timestamp
    - `DigestSession`: id, createdAt, title, calmScore, audioUrl, duration, items
  - Default sources in `lib/sources.ts`.
  - JSON persistence in `data/digests.json` plus MP3 files in `data/audio/`.
  - Realistic fixtures used whenever a credential is missing.

- [x] **Phase 3: Backend Pipeline API Routes**
  - `POST /api/scrape`: Stagehand + Browserbase, or fixture documents.
  - `POST /api/summarize`: Groq open-weight model with the GentleBrief system prompt, or fixture bullets.
  - `POST /api/synthesize-audio`: ElevenLabs TTS, or a speech-synthesis fallback flag.
  - `POST /api/digest/generate`: scrape, then summarize, then synthesize, then persist.
  - `GET /api/digest` and `GET /api/digest/[id]/audio`.

- [x] **Phase 4: Frontend UI Construction (shadcn/ui)**
  - Header with GentleBrief branding and a calm status badge.
  - Source selector card with toggleable chips.
  - Brew Digest trigger with skeleton loaders and progress.
  - Calm audio player: play/pause, speed, scrubber, volume.
  - Tabbed reader: Audio Brief and Written Insights.
  - Past digest history with replay.

- [x] **Phase 5: Polish & Error Resilience**
  - Missing credentials return realistic sample fixtures so the app stays interactive.
  - Sonner toasts for errors and completion.
  - Responsive layout check below 768px.
