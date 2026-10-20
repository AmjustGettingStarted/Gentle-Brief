"use client";

import { useState, type FormEvent } from "react";
import { Bot, Cpu, FlaskConical, Globe, Leaf, Link2, PenTool, Plus, Rocket, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isPublicHttpUrl, SOURCES, sourceDesk } from "@/lib/sources";
import { cn } from "@/lib/utils";
import type { TopicSource } from "@/types/digest";

const ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  rocket: Rocket,
  flask: FlaskConical,
  globe: Globe,
  bot: Bot,
  pen: PenTool,
  leaf: Leaf,
  link: Link2,
};

const pillClass =
  "h-auto min-h-11 w-full cursor-pointer justify-start px-3 py-2 transition-all duration-200 hover:scale-[1.01] hover:opacity-95 hover:shadow-sm";

export function SourceSelector({
  className,
  selected,
  customSources,
  disabled,
  onToggle,
  onAdd,
}: {
  className?: string;
  selected: string[];
  customSources: TopicSource[];
  disabled: boolean;
  onToggle: (id: string) => void;
  onAdd: (url: string) => void;
}) {
  const sources = [...SOURCES, ...customSources];

  return (
    <Card className={cn("rounded-2xl border border-zinc-200/80 bg-white shadow-sm ring-0 dark:bg-zinc-900", className)}>
      <CardHeader className="shrink-0">
        <CardTitle className="font-heading text-xl font-semibold tracking-tight uppercase">
          Sources
        </CardTitle>
        <CardDescription>Pick the desks this brief should read.</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {sources.map((source) => {
          const on = selected.includes(source.id);
          const Icon = ICONS[source.icon] ?? Link2;
          return (
            <Button
              key={source.id}
              type="button"
              variant={on ? "secondary" : "outline"}
              aria-pressed={on}
              disabled={disabled}
              className={cn(
                pillClass,
                on
                  ? "border-transparent bg-secondary text-secondary-foreground"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60",
              )}
              onClick={() => onToggle(source.id)}
            >
              <Avatar size="sm">
                <AvatarFallback className={on ? "bg-accent text-accent-foreground" : "bg-background"}>
                  <Icon />
                </AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-col items-start leading-tight">
                <span>{source.label}</span>
                <span className="font-mono text-[0.65rem] tracking-wide opacity-80">
                  {sourceDesk(source)}
                </span>
              </span>
            </Button>
          );
        })}
        <AddDesk disabled={disabled} onAdd={onAdd} />
      </CardContent>
    </Card>
  );
}

function AddDesk({ disabled, onAdd }: { disabled: boolean; onAdd: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = url.trim();
    if (!isPublicHttpUrl(next)) {
      setError("Use a public http or https address.");
      return;
    }
    onAdd(next);
    setUrl("");
    setError("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(pillClass, "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60")}
          />
        }
      >
        <Plus />
        Add custom URL
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a desk</DialogTitle>
          <DialogDescription>
            Paste a public page. GentleBrief will read it with the other desks.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <Input
            type="url"
            value={url}
            placeholder="https://"
            aria-label="Page address"
            onChange={(event) => setUrl(event.target.value)}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="cursor-pointer">
            Add desk
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
