export type PipelineMode = "live" | "fixture";

export type TopicSource = {
  id: string;
  label: string;
  url: string;
  icon: string;
  enabled: boolean;
};

export type DigestItem = {
  id: string;
  title: string;
  summary: string;
  originalUrl: string;
  sourceName: string;
  timestamp: string;
};

export type NoiseStats = {
  headlinesFiltered: number;
  adsRendered: number;
  minutesSaved: number;
};

export type DigestSession = {
  id: string;
  createdAt: string;
  title: string;
  calmScore: number;
  audioUrl: string | null;
  duration: number;
  items: DigestItem[];
  noise?: NoiseStats;
};

export type ScrapeDocument = {
  sourceId: string;
  sourceName: string;
  url: string;
  title: string;
  text: string;
  filtered: number;
};

export type ScrapeResult = {
  mode: PipelineMode;
  documents: ScrapeDocument[];
};

export type SummaryResult = {
  mode: PipelineMode;
  title: string;
  calmScore: number;
  items: DigestItem[];
};

export type AudioResult = {
  mode: PipelineMode;
  audioUrl: string | null;
  duration: number;
  fallback: boolean;
};
