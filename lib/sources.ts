import type { TopicSource } from "@/types/digest";

export const SOURCES: TopicSource[] = [
  {
    id: "tech",
    label: "Tech",
    url: "https://news.ycombinator.com",
    icon: "cpu",
    enabled: true,
  },
  {
    id: "indie",
    label: "Indie Hackers",
    url: "https://www.indiehackers.com",
    icon: "rocket",
    enabled: true,
  },
  {
    id: "science",
    label: "Science",
    url: "https://www.sciencenews.org",
    icon: "flask",
    enabled: true,
  },
  {
    id: "world",
    label: "World News",
    url: "https://apnews.com",
    icon: "globe",
    enabled: false,
  },
  {
    id: "ai",
    label: "AI & Open Source",
    url: "https://huggingface.co/blog",
    icon: "bot",
    enabled: false,
  },
  {
    id: "design",
    label: "Design & Craft",
    url: "https://sidebar.io/",
    icon: "pen",
    enabled: false,
  },
  {
    id: "mindset",
    label: "Mindset & Slow Living",
    url: "https://aeon.co/essays",
    icon: "leaf",
    enabled: false,
  },
];

const DESKS: Record<string, string> = {
  tech: "Hacker News",
  indie: "Indie Hackers",
  science: "Science News",
  world: "AP News",
  ai: "Hugging Face",
  design: "Sidebar",
  mindset: "Aeon essays",
};

export function sourceDesk(source: TopicSource): string {
  return DESKS[source.id] ?? source.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export function sourcesByIds(ids: string[]): TopicSource[] {
  const wanted = new Set(ids);
  return SOURCES.filter((source) => wanted.has(source.id));
}

export function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
      return false;
    }
    if (host === "0.0.0.0" || host === "::1") return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const [a, b] = host.split(".").map(Number);
      if (a === 10 || a === 127 || a === 0) return false;
      if (a === 192 && b === 168) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 169 && b === 254) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function resolveSources(ids: string[], custom: TopicSource[] = []): TopicSource[] {
  const extras = custom.filter(
    (source) =>
      ids.includes(source.id) && source.id.startsWith("custom-") && isPublicHttpUrl(source.url),
  );
  return [...sourcesByIds(ids), ...extras];
}
