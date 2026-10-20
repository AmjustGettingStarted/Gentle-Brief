"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DigestHistory } from "@/components/digest-history";
import { DigestReader } from "@/components/digest-reader";
import { SiteHeader } from "@/components/site-header";
import { SourceSelector } from "@/components/source-selector";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { SOURCES } from "@/lib/sources";
import type { DigestSession, PipelineMode, TopicSource } from "@/types/digest";

const STAGES = [
  { at: 18, label: "Reading the sources" },
  { at: 52, label: "Distilling the signal" },
  { at: 82, label: "Recording the voice" },
];

export function Dashboard() {
  const [selected, setSelected] = useState(() =>
    SOURCES.filter((source) => source.enabled).map((source) => source.id),
  );
  const [customSources, setCustomSources] = useState<TopicSource[]>([]);
  const [sessions, setSessions] = useState<DigestSession[]>([]);
  const [active, setActive] = useState<DigestSession | null>(null);
  const [mode, setMode] = useState<PipelineMode | null>("fixture");
  const [brewing, setBrewing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/digest");
        if (!response.ok) throw new Error("History did not load.");
        const body = (await response.json()) as { sessions: DigestSession[] };
        if (cancelled) return;
        setSessions(body.sessions);
        setActive((current) => current ?? body.sessions[0] ?? null);
      } catch {
        if (!cancelled) toast.error("Past briefs could not be loaded.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!brewing) return;
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 90 ? current : current + 4));
    }, 400);
    return () => window.clearInterval(timer);
  }, [brewing]);

  const stage = STAGES.reduce((label, item) => (progress >= item.at ? item.label : label), STAGES[0].label);

  function toggleSource(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function addCustom(url: string) {
    const source: TopicSource = {
      id: `custom-${crypto.randomUUID()}`,
      label: new URL(url).hostname.replace(/^www\./, ""),
      url,
      icon: "link",
      enabled: true,
    };
    setCustomSources((current) => [...current, source]);
    setSelected((current) => [...current, source.id]);
  }

  async function brew() {
    if (selected.length === 0) {
      toast.error("Choose at least one source.");
      return;
    }

    setBrewing(true);
    setProgress(8);
    try {
      const response = await fetch("/api/digest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceIds: selected,
          customSources: customSources.filter((source) => selected.includes(source.id)),
        }),
      });
      const body = (await response.json()) as {
        session?: DigestSession;
        mode?: PipelineMode;
        voice?: "elevenlabs" | "browser";
        error?: string;
      };
      if (!response.ok || !body.session) {
        throw new Error(body.error ?? "The brief did not finish.");
      }
      setProgress(100);
      setActive(body.session);
      setMode(body.mode ?? "fixture");
      setSessions((current) => [body.session!, ...current.filter((item) => item.id !== body.session!.id)]);
      if (body.mode === "live" && body.voice === "browser") {
        toast.warning("The brief is from live sources. ElevenLabs did not return audio, so this browser is reading it.");
      } else if (body.mode === "live") {
        toast.success("Your brief is ready.");
      } else {
        toast.info("Sample brief is ready. Add API keys for a live scrape and voice.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "The brief did not finish.";
      toast.error(message);
    } finally {
      setBrewing(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <SiteHeader brewing={brewing} />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-6 py-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="rise-in flex flex-col gap-4" style={{ animationDelay: "80ms" }}>
            <SourceSelector
              selected={selected}
              customSources={customSources}
              disabled={brewing}
              onToggle={toggleSource}
              onAdd={addCustom}
            />
            <Button
              type="button"
              size="lg"
              className="h-12 text-base font-semibold tracking-wide uppercase"
              disabled={brewing}
              onClick={() => void brew()}
            >
              {brewing ? "Brewing" : "Brew Digest"}
            </Button>
            {brewing ? (
              <Progress value={progress}>
                <ProgressLabel className="font-mono text-xs">{stage}</ProgressLabel>
                <ProgressValue />
              </Progress>
            ) : null}
          </div>
          <div
            className="rise-in border border-border shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            style={{ animationDelay: "160ms" }}
          >
            <DigestReader session={active} mode={mode} brewing={brewing} stage={stage} />
          </div>
        </div>
        <div className="rise-in" style={{ animationDelay: "240ms" }}>
          <DigestHistory
            sessions={sessions}
            activeId={active?.id ?? null}
            onReplay={(session) => {
              setActive(session);
              setMode(session.audioUrl ? "live" : "fixture");
            }}
          />
        </div>
      </main>
    </div>
  );
}
