"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { startAmbience } from "@/lib/ambience";
import type { AmbienceChoice } from "@/lib/brief-options";
import { buildScript } from "@/lib/script";
import type { DigestSession } from "@/types/digest";

const SPEEDS = [0.75, 1, 1.25] as const;

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}

function sliderValue(value: number | readonly number[]) {
  return typeof value === "number" ? value : (value[0] ?? 0);
}

function timestamp() {
  return Date.now();
}

export function AudioPlayer({
  session,
  ambience = "silent",
}: {
  session: DigestSession;
  ambience?: AmbienceChoice;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const tokenRef = useRef(0);
  const offsetRef = useRef(0);
  const startedAtRef = useRef(0);
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [muted, setMuted] = useState(false);
  const spoken = session.audioUrl === null;

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    return () => {
      tokenRef.current += 1;
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!playing || muted || ambience === "silent") return;
    return startAmbience(ambience);
  }, [playing, muted, ambience]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || spoken) return;
    audio.playbackRate = speed;
    audio.muted = muted;
  }, [speed, muted, spoken]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (spoken) {
        const elapsed = ((timestamp() - startedAtRef.current) / 1000) * speed;
        const next = Math.min(session.duration, offsetRef.current + elapsed);
        setTime(next);
        if (next >= session.duration) {
          window.speechSynthesis?.cancel();
          setPlaying(false);
          offsetRef.current = 0;
          setTime(0);
        }
        return;
      }
      const audio = audioRef.current;
      if (!audio) return;
      setTime(audio.currentTime);
      if (audio.ended) setPlaying(false);
    }, 200);
    return () => window.clearInterval(timer);
  }, [playing, spoken, speed, session.duration]);

  function seek(next: number) {
    const clamped = Math.max(0, Math.min(session.duration, next));
    setTime(clamped);
    if (!spoken) {
      const audio = audioRef.current;
      if (audio) audio.currentTime = clamped;
      return;
    }
    offsetRef.current = clamped;
    if (playingRef.current) speakFrom(clamped);
  }

  function speakFrom(offset: number, rate = speed, volume = muted ? 0 : 1) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const token = tokenRef.current + 1;
    tokenRef.current = token;
    window.speechSynthesis.cancel();
    const words = buildScript(session.title, session.items).split(/\s+/).filter(Boolean);
    const start = Math.min(
      words.length,
      Math.floor((offset / Math.max(session.duration, 1)) * words.length),
    );
    const utterance = new SpeechSynthesisUtterance(words.slice(start).join(" ") || session.title);
    utterance.rate = 0.9 * rate;
    utterance.volume = volume;
    utterance.onend = () => {
      if (tokenRef.current !== token || !playingRef.current) return;
      setPlaying(false);
      offsetRef.current = 0;
      setTime(0);
    };
    offsetRef.current = offset;
    startedAtRef.current = timestamp();
    window.speechSynthesis.speak(utterance);
  }

  function togglePlay() {
    if (!spoken) {
      const audio = audioRef.current;
      if (!audio) return;
      if (playing) {
        audio.pause();
        setPlaying(false);
        return;
      }
      void audio.play();
      setPlaying(true);
      return;
    }

    if (playing) {
      tokenRef.current += 1;
      window.speechSynthesis?.cancel();
      const elapsed = ((timestamp() - startedAtRef.current) / 1000) * speed;
      offsetRef.current = Math.min(session.duration, offsetRef.current + elapsed);
      setPlaying(false);
      return;
    }

    setPlaying(true);
    speakFrom(offsetRef.current);
  }

  function changeSpeed(next: (typeof SPEEDS)[number]) {
    if (spoken && playing) {
      const elapsed = ((timestamp() - startedAtRef.current) / 1000) * speed;
      offsetRef.current = Math.min(session.duration, offsetRef.current + elapsed);
    }
    setSpeed(next);
    if (spoken && playing) speakFrom(offsetRef.current, next, muted ? 0 : 1);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (!spoken || !playing) return;
    const elapsed = ((timestamp() - startedAtRef.current) / 1000) * speed;
    offsetRef.current = Math.min(session.duration, offsetRef.current + elapsed);
    speakFrom(offsetRef.current, speed, next ? 0 : 1);
  }

  return (
    <Card className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm ring-0 dark:bg-zinc-900">
      <CardContent className="flex flex-col gap-4">
        {session.audioUrl ? (
          <audio ref={audioRef} src={session.audioUrl} preload="metadata" />
        ) : null}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon-lg"
                  aria-label={playing ? "Pause brief" : "Play brief"}
                  onClick={togglePlay}
                />
              }
            >
              {playing ? <Pause /> : <Play />}
            </TooltipTrigger>
            <TooltipContent>{playing ? "Pause" : "Play"}</TooltipContent>
          </Tooltip>
          <div className="flex flex-1 flex-col gap-2">
            <Slider
              aria-label="Brief position"
              min={0}
              max={Math.max(session.duration, 1)}
              step={0.1}
              value={[time]}
              onValueChange={(value) => seek(sliderValue(value))}
            />
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>{formatTime(time)}</span>
              <span>{formatTime(session.duration)}</span>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={muted ? "Unmute" : "Mute"}
                  onClick={toggleMute}
                />
              }
            >
              {muted ? <VolumeX /> : <Volume2 />}
            </TooltipTrigger>
            <TooltipContent>{muted ? "Unmute" : "Mute"}</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-wrap gap-2">
          {SPEEDS.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={speed === option ? "secondary" : "outline"}
              aria-pressed={speed === option}
              onClick={() => changeSpeed(option)}
            >
              {option === 1 ? "1x" : `${option}x`}
            </Button>
          ))}
          <p className="ml-auto self-center font-mono text-xs text-muted-foreground">
            {spoken ? "Browser voice" : "Recorded voice"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
