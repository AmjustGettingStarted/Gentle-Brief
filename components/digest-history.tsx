"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <Card className="rounded-xl border border-border shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-0">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-semibold tracking-tight uppercase">
          Past briefs
        </CardTitle>
        <CardDescription>Replay a brief you already brewed.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="flex flex-col gap-3 pr-3">
            {sessions.map((session, index) => (
              <div key={session.id} className="rise-in" style={{ animationDelay: `${index * 80}ms` }}>
                {index > 0 ? <Separator className="mb-3" /> : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-semibold uppercase">
                      {session.title}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatWhen(session.createdAt)} · {session.items.length} sources
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      Calm {session.calmScore}
                    </Badge>
                    <Button
                      type="button"
                      variant={session.id === activeId ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => onReplay(session)}
                    >
                      Replay
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
