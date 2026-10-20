"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DigestHistory } from "@/components/digest-history";
import { DigestReader } from "@/components/digest-reader";
import { PacingMenu } from "@/components/pacing-card";
import { SiteHeader } from "@/components/site-header";
import { SourceSelector } from "@/components/source-selector";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { saveUserHistory, saveUserSettings, useUserHistory, useUserSettings } from "@/lib/browser-store";
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
  const sessions = useUserHistory();
  const settings = useUserSettings();
  const [active, setActive] = useState<DigestSession | null>(null);
  const [mode, setMode] = useState<PipelineMode | null>(null);
  const [brewing, setBrewing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const grid = document.querySelector("[data-brief-grid]");
    const left = grid?.children[0] as HTMLElement | undefined;
    const right = grid?.children[1] as HTMLElement | undefined;
    const card = left?.querySelector("[data-slot=card]") as HTMLElement | undefined;
    const content = card?.querySelector("[data-slot=card-content]") as HTMLElement | undefined;
    const brewButton = left?.querySelector("button") as HTMLElement | undefined;
    let stored: unknown = null;
    try {
      stored = JSON.parse(window.localStorage.getItem("gentlebrief_user_settings") ?? "null");
    } catch {
      stored = "unreadable";
    }
    // #region agent log
    fetch("http://127.0.0.1:7779/ingest/41dc1293-3851-4b10-979f-d27ffb3a16ff",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"6ca59f"},body:JSON.stringify({sessionId:"6ca59f",runId:"pre-fix",hypothesisId:"A,E",location:"components/dashboard.tsx:layout",message:"column stretch and stored voice",data:{stored,settings,activeTitle:active?.title??null,activeHasAudio:Boolean(active?.audioUrl),leftH:left?Math.round(left.getBoundingClientRect().height):0,rightH:right?Math.round(right.getBoundingClientRect().height):0,cardH:card?Math.round(card.getBoundingClientRect().height):0,contentH:content?Math.round(content.getBoundingClientRect().height):0,contentScroll:content?.scrollHeight??0,buttonTop:brewButton&&card?Math.round(brewButton.getBoundingClientRect().top-card.getBoundingClientRect().bottom):null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [active, brewing, settings]);

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
    // #region agent log
    fetch("http://127.0.0.1:7779/ingest/41dc1293-3851-4b10-979f-d27ffb3a16ff",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"6ca59f"},body:JSON.stringify({sessionId:"6ca59f",runId:"pre-fix",hypothesisId:"A,B",location:"components/dashboard.tsx:brew",message:"brew sending voice",data:{voice:settings.voice,pace:settings.pace,ambience:settings.ambience},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    try {
      const response = await fetch("/api/digest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceIds: selected,
          customSources: customSources.filter((source) => selected.includes(source.id)),
          voice: settings.voice,
          pace: settings.pace,
        }),
      });
      const body = (await response.json()) as {
        session?: DigestSession;
        mode?: PipelineMode;
        voice?: "elevenlabs" | "browser";
        error?: string;
      };
      // #region agent log
      fetch("http://127.0.0.1:7779/ingest/41dc1293-3851-4b10-979f-d27ffb3a16ff",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"6ca59f"},body:JSON.stringify({sessionId:"6ca59f",runId:"pre-fix",hypothesisId:"B,C",location:"components/dashboard.tsx:brew-result",message:"brew voice result",data:{ok:response.ok,mode:body.mode??null,voice:body.voice??null,hasAudio:Boolean(body.session?.audioUrl),error:body.error??null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (!response.ok || !body.session) {
        throw new Error(body.error ?? "The brief did not finish.");
      }
      setProgress(100);
      setActive(body.session);
      setMode(body.mode ?? "fixture");
      saveUserHistory([body.session, ...sessions.filter((item) => item.id !== body.session.id)]);
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
    <div className="min-h-[100dvh]">
      <SiteHeader brewing={brewing} />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-6 py-8">
        <div data-brief-grid className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
          <div className="rise-in flex flex-col gap-4 md:col-span-4" style={{ animationDelay: "80ms" }}>
            <SourceSelector
              selected={selected}
              customSources={customSources}
              disabled={brewing}
              onToggle={toggleSource}
              onAdd={addCustom}
            />
            <PacingMenu settings={settings} disabled={brewing} onChange={saveUserSettings} />
            <Button
              type="button"
              size="lg"
              className="h-12 shrink-0 text-base font-semibold tracking-wide uppercase"
              disabled={brewing}
              onClick={() => void brew()}
            >
              {brewing ? "Brewing" : "Brew Digest"}
            </Button>
            {brewing ? (
              <Progress value={progress} className="shrink-0">
                <ProgressLabel className="font-mono text-xs">{stage}</ProgressLabel>
                <ProgressValue />
              </Progress>
            ) : null}
          </div>
          <div className="flex flex-col md:col-span-8">
            <div className="rise-in flex flex-col" style={{ animationDelay: "160ms" }}>
              <DigestReader
                session={active}
                mode={mode}
                brewing={brewing}
                stage={stage}
                ambience={settings.ambience}
              />
            </div>
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
