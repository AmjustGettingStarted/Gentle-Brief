"use client";

import type { ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isAmbienceChoice,
  isPaceChoice,
  isVoiceChoice,
  VOICES,
  type AmbienceChoice,
  type BriefSettings,
  type PaceChoice,
  type VoiceChoice,
} from "@/lib/brief-options";
import { cn } from "@/lib/utils";

const VOICE_SHORT: Record<VoiceChoice, string> = {
  charlotte: "Charlotte",
  adam: "Adam",
};

const PACE_SHORT: Record<PaceChoice, string> = {
  quick: "Quick",
  deep: "Deep",
};

const AMBIENCE_SHORT: Record<AmbienceChoice, string> = {
  silent: "Silent",
  rain: "Soft Rain",
  hiss: "Lo-Fi Hiss",
};

export function PacingMenu({
  settings,
  disabled,
  onChange,
}: {
  settings: BriefSettings;
  disabled: boolean;
  onChange: (patch: Partial<BriefSettings>) => void;
}) {
  const summary = `${VOICE_SHORT[settings.voice]} · ${PACE_SHORT[settings.pace]} · ${AMBIENCE_SHORT[settings.ambience]}`;

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 w-full cursor-pointer justify-between px-3"
          />
        }
      >
        <span className="truncate">Voice and pace · {summary}</span>
        <ChevronDown data-icon="inline-end" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-[200]" side="bottom" align="end" sideOffset={8}>
          <Menu.Popup className="w-64 origin-(--transform-origin) rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-sm ring-0 outline-none dark:bg-zinc-900">
            <SettingGroup label="Voice">
              <Menu.RadioGroup
                value={settings.voice}
                disabled={disabled}
                onValueChange={(value) => {
                  if (isVoiceChoice(value)) onChange({ voice: value });
                }}
              >
                <SettingItem value="charlotte">{VOICES.charlotte.label}</SettingItem>
                <SettingItem value="adam">{VOICES.adam.label}</SettingItem>
              </Menu.RadioGroup>
            </SettingGroup>
            <SettingGroup label="Target pace">
              <Menu.RadioGroup
                value={settings.pace}
                disabled={disabled}
                onValueChange={(value) => {
                  if (isPaceChoice(value)) onChange({ pace: value });
                }}
              >
                <SettingItem value="quick">Quick (60s)</SettingItem>
                <SettingItem value="deep">Deep (3 min)</SettingItem>
              </Menu.RadioGroup>
            </SettingGroup>
            <SettingGroup label="Ambient soundscape">
              <Menu.RadioGroup
                value={settings.ambience}
                disabled={disabled}
                onValueChange={(value) => {
                  if (isAmbienceChoice(value)) onChange({ ambience: value });
                }}
              >
                <SettingItem value="silent">Silent</SettingItem>
                <SettingItem value="rain">Soft Rain</SettingItem>
                <SettingItem value="hiss">Lo-Fi Hiss</SettingItem>
              </Menu.RadioGroup>
            </SettingGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function SettingGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Menu.Group className="flex flex-col gap-1 py-1">
      <Menu.GroupLabel className="px-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </Menu.GroupLabel>
      {children}
    </Menu.Group>
  );
}

function SettingItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <Menu.RadioItem
      value={value}
      closeOnClick={false}
      onPointerEnter={(event) => {
        const el = event.currentTarget;
        const bg = getComputedStyle(el).backgroundColor;
        // #region agent log
        fetch("http://127.0.0.1:7779/ingest/41dc1293-3851-4b10-979f-d27ffb3a16ff",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"6ca59f"},body:JSON.stringify({sessionId:"6ca59f",runId:"pre-fix",hypothesisId:"F,G",location:"components/pacing-card.tsx:hover",message:"menu item hover",data:{label:el.textContent,checked:el.hasAttribute("data-checked"),highlighted:el.hasAttribute("data-highlighted"),bg},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }}
      className={cn(
        "cursor-pointer rounded-lg px-2 py-1.5 text-sm text-foreground outline-none select-none",
        "data-highlighted:bg-muted data-highlighted:text-foreground",
        "data-checked:bg-secondary data-checked:text-secondary-foreground",
        "data-checked:data-highlighted:bg-muted data-checked:data-highlighted:text-foreground",
      )}
    >
      {children}
    </Menu.RadioItem>
  );
}
