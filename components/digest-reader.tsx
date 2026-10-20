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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readingMinutes } from "@/lib/script";
import { cn } from "@/lib/utils";
import type { DigestSession, PipelineMode } from "@/types/digest";

export function DigestReader({
  session,
  mode,
  brewing,
  stage,
}: {
  session: DigestSession | null;
  mode: PipelineMode | null;
  brewing: boolean;
  stage: string;
}) {
  return (
    <section className="relative overflow-hidden bg-background p-5 sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-14 h-44 w-44 rotate-12 bg-primary" />
      <div aria-hidden className="pointer-events-none absolute right-10 bottom-0 h-28 w-7 bg-secondary" />
      <div aria-hidden className="pointer-events-none absolute bottom-16 -left-6 h-3 w-36 -rotate-6 bg-accent" />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3 pr-16">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              Today&apos;s brief
            </p>
            <h1 className="mt-1 max-w-[18ch] font-heading text-4xl leading-none font-bold tracking-tight uppercase">
              {brewing ? "Brewing" : (session?.title ?? "Nothing on the desk")}
            </h1>
          </div>
          {session && !brewing ? (
            <Badge variant="outline" className="h-7 bg-background font-mono">
              Calm {session.calmScore}
            </Badge>
          ) : null}
        </div>

        {brewing ? <ReaderSkeleton stage={stage} /> : null}
        {session && !brewing ? <ReaderTabs session={session} mode={mode} /> : null}
        {!session && !brewing ? (
          <Card className="rounded-xl border border-border bg-background shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-0">
            <CardHeader>
              <CardTitle>The desk is clear</CardTitle>
              <CardDescription>Choose sources and brew a brief when you want one.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </div>
    </section>
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

function ReaderTabs({
  session,
  mode,
}: {
  session: DigestSession;
  mode: PipelineMode | null;
}) {
  return (
    <Tabs defaultValue="audio">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="audio">Audio Brief</TabsTrigger>
          <TabsTrigger value="written">Written Insights</TabsTrigger>
        </TabsList>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            How this was made
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How this brief was made</DialogTitle>
              <DialogDescription>
                GentleBrief reads the sources you pick, rewrites them into a short stoic brief,
                then speaks it slowly.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm leading-6 text-muted-foreground">
              {mode === "live"
                ? "This one was scraped, rewritten, and voiced with the services in your environment."
                : "This one used sample pages and this browser's voice. Add Browserbase, Groq, and ElevenLabs keys when you want a live brief."}
            </p>
          </DialogContent>
        </Dialog>
      </div>
      <TabsContent value="audio" className="pt-2">
        <AudioPlayer key={session.id} session={session} />
      </TabsContent>
      <TabsContent value="written" className="flex flex-col gap-3 pt-2">
        {session.items.map((item) => (
          <Card
            key={item.id}
            className="rounded-xl border border-border bg-background shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-0"
          >
            <CardHeader>
              <CardTitle className="uppercase">{item.title}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {item.sourceName} · {readingMinutes(item.summary)} min read
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Separator />
              <div className="flex flex-col gap-2 text-base leading-relaxed">
                {item.summary.split("\n").map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <a
                href={item.originalUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "link" }), "h-auto justify-start px-0")}
              >
                {item.sourceName} source
              </a>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}
