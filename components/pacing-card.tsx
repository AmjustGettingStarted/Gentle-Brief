"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VOICES, type AmbienceChoice, type BriefSettings, type PaceChoice } from "@/lib/brief-options";
import { cn } from "@/lib/utils";

const choiceClass = "cursor-pointer transition-all duration-200";

export function PacingCard({
  settings,
  disabled,
  onChange,
}: {
  settings: BriefSettings;
  disabled: boolean;
  onChange: (patch: Partial<BriefSettings>) => void;
}) {
  return (
    <Card className="min-h-48 flex-1 rounded-xl border border-border shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-0">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-semibold tracking-tight uppercase">
          Pacing & Voice
        </CardTitle>
        <CardDescription>Choices for the next brief. They stay on this browser.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChoiceRow label="Voice">
          <Choice
            pressed={settings.voice === "charlotte"}
            disabled={disabled}
            onClick={() => onChange({ voice: "charlotte" })}
          >
            {VOICES.charlotte.label}
          </Choice>
          <Choice
            pressed={settings.voice === "adam"}
            disabled={disabled}
            onClick={() => onChange({ voice: "adam" })}
          >
            {VOICES.adam.label}
          </Choice>
        </ChoiceRow>
        <ChoiceRow label="Target pace">
          <Choice
            pressed={settings.pace === "quick"}
            disabled={disabled}
            onClick={() => onChange({ pace: "quick" satisfies PaceChoice })}
          >
            Quick (60s)
          </Choice>
          <Choice
            pressed={settings.pace === "deep"}
            disabled={disabled}
            onClick={() => onChange({ pace: "deep" satisfies PaceChoice })}
          >
            Deep (3 min)
          </Choice>
        </ChoiceRow>
        <ChoiceRow label="Ambient soundscape">
          <Choice
            pressed={settings.ambience === "silent"}
            disabled={disabled}
            onClick={() => onChange({ ambience: "silent" satisfies AmbienceChoice })}
          >
            Silent
          </Choice>
          <Choice
            pressed={settings.ambience === "rain"}
            disabled={disabled}
            onClick={() => onChange({ ambience: "rain" satisfies AmbienceChoice })}
          >
            Soft Rain
          </Choice>
          <Choice
            pressed={settings.ambience === "hiss"}
            disabled={disabled}
            onClick={() => onChange({ ambience: "hiss" satisfies AmbienceChoice })}
          >
            Lo-Fi Hiss
          </Choice>
        </ChoiceRow>
      </CardContent>
    </Card>
  );
}

function ChoiceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Choice({
  pressed,
  disabled,
  onClick,
  children,
}: {
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={pressed ? "secondary" : "outline"}
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(choiceClass, pressed ? "border-transparent" : "border-border/60")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
