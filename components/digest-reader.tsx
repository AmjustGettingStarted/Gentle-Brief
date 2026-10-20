"use client";

import { AudioPlayer } from "@/components/audio-player";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { AmbienceChoice } from "@/lib/brief-options";
import { readingMinutes } from "@/lib/script";
import { cn } from "@/lib/utils";
import type { DigestItem, DigestSession, NoiseStats, PipelineMode } from "@/types/digest";

const THOUGHTS = [
  "One clear page is enough for a morning.",
  "Leave the rest of the internet where you found it.",
  "A short brief is a finished brief.",
  "Read what you came for, then close the desk.",
  "Attention is quieter when it has an edge.",
];

export function DigestReader({
  session,
  mode,
  brewing,
  stage,
  ambience,
}: {
  session: DigestSession | null;
  mode: PipelineMode | null;
  brewing: boolean;
  stage: string;
  ambience: AmbienceChoice;
}) {
  return (
    <section className="relative flex h-full min-h-full flex-1 flex-col overflow-hidden bg-background p-5 sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-14 h-44 w-44 rotate-12 bg-primary" />
      <div aria-hidden className="pointer-events-none absolute right-10 bottom-0 h-28 w-7 bg-secondary" />
      <div aria-hidden className="pointer-events-none absolute bottom-16 -left-6 h-3 w-36 -rotate-6 bg-accent" />

      <div className="relative flex h-full flex-1 flex-col gap-5">
        {session?.noise && !brewing ? <NoiseBanner noise={session.noise} /> : null}
        <div className="flex flex-wrap items-end justify-between gap-3 pr-16">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              Today&apos;s brief
            </p>
            <h1 className="mt-1 max-w-xl font-heading text-4xl leading-[0.95] font-bold tracking-tight">
              {brewing ? "Brewing" : (session?.title ?? "Nothing on the desk")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {session && !brewing ? (
              <Badge variant="outline" className="h-7 bg-background font-mono">
                Calm {session.calmScore}
              </Badge>
            ) : null}
            <HowItWasMade mode={mode} />
          </div>
        </div>

        {brewing ? <ReaderSkeleton stage={stage} /> : null}
        {session && !brewing ? <BriefCompanion session={session} ambience={ambience} /> : null}
        {!session && !brewing ? (
          <Card className="rounded-xl border border-border bg-background shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-0">
            <CardHeader>
              <CardTitle>The desk is clear</CardTitle>
              <CardDescription>Choose sources and brew a brief when you want one.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        {!brewing ? <ThoughtCard seed={session?.id ?? "empty"} /> : null}
      </div>
    </section>
  );
}

function BriefCompanion({ session, ambience }: { session: DigestSession; ambience: AmbienceChoice }) {
  const sources = uniqueSources(session.items);

  return (
    <div className="flex flex-col gap-5">
      <AudioPlayer key={session.id} session={session} ambience={ambience} />
      <Card className="rounded-xl border border-border bg-background shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-0">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Transcript</CardTitle>
          <CardDescription>Read along while the brief plays.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {session.items.map((item, index) => (
            <article key={item.id} className="flex flex-col gap-2">
              {index > 0 ? <Separator className="mb-3" /> : null}
              <h2 className="font-heading text-lg leading-tight font-semibold">{item.title}</h2>
              <p className="font-mono text-xs text-muted-foreground">
                {item.sourceName} · {readingMinutes(item.summary)} min read
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed">
                {transcriptLines(item.summary).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </CardContent>
      </Card>
      {sources.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Key sources consulted
          </h2>
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-auto cursor-pointer px-3 py-1.5 transition-all duration-200 hover:opacity-95 hover:shadow-sm",
                )}
              >
                {source.name}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ThoughtCard({ seed }: { seed: string }) {
  const line = THOUGHTS[hashSeed(seed) % THOUGHTS.length];
  return (
    <Card className="mt-auto rounded-xl border border-border bg-background shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-0">
      <CardHeader>
        <CardDescription className="font-mono text-xs tracking-wide uppercase">
          Thought of the day
        </CardDescription>
        <CardTitle className="font-heading text-2xl leading-tight font-semibold">{line}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function HowItWasMade({ mode }: { mode: PipelineMode | null }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" className="cursor-pointer" />}>
        How this was made
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How this brief was made</DialogTitle>
          <DialogDescription>
            GentleBrief reads the sources you pick, rewrites them into a short stoic brief, then speaks it slowly.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-6 text-muted-foreground">
          {mode === "live"
            ? "This one was scraped, rewritten, and voiced with the services in your environment."
            : "This one used sample pages and this browser's voice. Add Browserbase, Groq, and ElevenLabs keys when you want a live brief."}
        </p>
      </DialogContent>
    </Dialog>
  );
}

function NoiseBanner({ noise }: { noise: NoiseStats }) {
  return (
    <Badge
      variant="outline"
      className="h-auto max-w-full bg-background px-3 py-1 font-mono text-[0.7rem] leading-5 whitespace-normal"
    >
      Noise intercepted · Filtered {noise.headlinesFiltered} clickbait headlines · {noise.adsRendered} ads rendered · ~{noise.minutesSaved}m doomscroll time saved
    </Badge>
  );
}

function ReaderSkeleton({ stage }: { stage: string }) {
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
      <p className="font-mono text-xs text-muted-foreground">{stage}</p>
    </div>
  );
}

function transcriptLines(summary: string): string[] {
  const lines = summary
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : ["The page had little that was worth repeating."];
}

function uniqueSources(items: DigestItem[]): Array<{ name: string; url: string }> {
  const seen = new Set<string>();
  const sources: Array<{ name: string; url: string }> = [];
  for (const item of items) {
    if (!item.originalUrl || seen.has(item.originalUrl)) continue;
    seen.add(item.originalUrl);
    sources.push({ name: item.sourceName, url: item.originalUrl });
  }
  return sources;
}

function hashSeed(seed: string): number {
  return [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
}
