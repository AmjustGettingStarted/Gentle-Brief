"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DigestSession } from "@/types/digest";

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DigestHistory({
  sessions,
  activeId,
  onReplay,
}: {
  sessions: DigestSession[];
  activeId: string | null;
  onReplay: (session: DigestSession) => void;
}) {
  return (
    <Card className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm ring-0 dark:bg-zinc-900">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-semibold tracking-tight uppercase">
          Past briefs
        </CardTitle>
        <CardDescription>Replay a brief you already brewed.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No briefs on this browser yet.</p>
            ) : null}
            {sessions.map((session, index) => (
              <div key={session.id} className="rise-in" style={{ animationDelay: `${index * 80}ms` }}>
                {index > 0 ? <Separator className="mb-3" /> : null}
                <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-semibold">
                      {session.title}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatWhen(session.createdAt)} · {session.items.length} {session.items.length === 1 ? "source" : "sources"}
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit font-mono">
                    Calm {session.calmScore}
                  </Badge>
                  <Button
                    type="button"
                    variant={session.id === activeId ? "secondary" : "outline"}
                    size="sm"
                    className="w-fit cursor-pointer"
                    onClick={() => onReplay(session)}
                  >
                    Replay
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
