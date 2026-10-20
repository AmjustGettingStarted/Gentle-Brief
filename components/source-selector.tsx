"use client";

import { Cpu, FlaskConical, Globe, Rocket, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SOURCES } from "@/lib/sources";

const ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  rocket: Rocket,
  flask: FlaskConical,
  globe: Globe,
};

export function SourceSelector({
  selected,
  disabled,
  onToggle,
}: {
  selected: string[];
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="rounded-xl border border-border shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-0">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-semibold tracking-tight uppercase">
          Sources
        </CardTitle>
        <CardDescription>Pick the desks this brief should read.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {SOURCES.map((source) => {
          const on = selected.includes(source.id);
          const Icon = ICONS[source.icon] ?? Cpu;
          return (
            <Button
              key={source.id}
              type="button"
              variant={on ? "secondary" : "outline"}
              aria-pressed={on}
              disabled={disabled}
              className="h-11 justify-start px-3"
              onClick={() => onToggle(source.id)}
            >
              <Avatar size="sm">
                <AvatarFallback className={on ? "bg-accent text-accent-foreground" : undefined}>
                  <Icon />
                </AvatarFallback>
              </Avatar>
              {source.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
