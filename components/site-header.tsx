import { Badge } from "@/components/ui/badge";

export function SiteHeader({ brewing }: { brewing: boolean }) {
  return (
    <header className="sticky top-0 z-[100] border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-4">
        <div className="rise-in">
          <p className="font-heading text-2xl leading-none font-bold tracking-tight uppercase">
            GentleBrief
          </p>
          <p className="mt-1 font-mono text-xs tracking-wide text-muted-foreground">
            Slow and steady
          </p>
        </div>
        <Badge variant={brewing ? "secondary" : "outline"} className="h-7 gap-2 px-3">
          <span
            className={brewing ? "size-2 bg-accent" : "size-2 bg-success"}
            aria-hidden
          />
          {brewing ? "Brewing" : "Ready"}
        </Badge>
      </div>
    </header>
  );
}
