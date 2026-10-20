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
];

export function sourcesByIds(ids: string[]): TopicSource[] {
  const wanted = new Set(ids);
  return SOURCES.filter((source) => wanted.has(source.id));
}
