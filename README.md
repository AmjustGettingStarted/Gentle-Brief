# Gentle Brief

Gentle Brief is a Next.js app for turning a curated set of sources into a polished daily brief. It reads the latest input from selected feeds, distills the signal, and presents a readable summary with pacing and voice controls.

## What it does

- Selects and combines topic sources from built-in and custom URLs
- Brews a short digest from those sources
- Supports a pacing menu and voice ambience settings
- Keeps a history of generated digests for replay
- Uses a browser-based or live pipeline depending on configuration

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Sonner for toast notifications

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the app in your browser:

   ```text
   http://localhost:3000
   ```

## Available scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project notes

This project is a front-end digest dashboard with a generated brief workflow. The main app entry is `app/page.tsx`, and the digest UI lives under the `components/` directory.

If you want to enable live source fetching or voice playback, configure the relevant API keys and environment settings for the digest pipeline before running the app.

## License

This project is private and not currently configured with a public license.
