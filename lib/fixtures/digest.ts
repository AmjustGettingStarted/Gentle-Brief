import { buildScript, estimateDuration } from "@/lib/script";
import type { DigestItem, DigestSession, ScrapeDocument, TopicSource } from "@/types/digest";

type FixtureCopy = {
  pageTitle: string;
  text: string;
  itemTitle: string;
  summary: string;
};

const COPY: Record<string, FixtureCopy> = {
  tech: {
    pageTitle: "Software desks, without the pile-on",
    text: "A compiler release shipped with a shorter changelog and fewer new warnings. Maintainers asked users to wait a week before upgrading production. A local-first notes tool added a plain-text export that does not require an account. An infrastructure write-up traced an outage to one mis-set timeout and listed the rollback that restored traffic.",
    itemTitle: "The tools got a little quieter",
    summary:
      "1. A compiler release shipped with fewer warnings and a shorter changelog.\n2. A notes app added a plain export, with no account required.\n3. One outage write-up named a single timeout and the fix that followed.",
  },
  indie: {
    pageTitle: "Small products, steady weeks",
    text: "A one-person product raised its price and kept the same support hours. The founder wrote that the queue did not grow. A weekly letter stayed weekly and kept its short format. A small billing tool crossed a modest monthly mark and did not announce a funding round.",
    itemTitle: "Prices moved, the week did not",
    summary:
      "1. A one-person product raised its price and kept the same support hours.\n2. A weekly letter stayed weekly, in the same short format.\n3. A billing tool crossed a modest monthly mark and skipped the announcement.",
  },
  science: {
    pageTitle: "Field notes, not headlines",
    text: "A reef survey reported slow recovery in one monitored cove and said the next count is scheduled for spring. A battery paper described longer cycle life at ordinary room temperature, with the test method printed in the appendix. A sleep study found a small gain from a fixed lights-out time across four weeks.",
    itemTitle: "Measured notes from the labs",
    summary:
      "1. A reef survey reported slow recovery in one monitored cove.\n2. A battery paper described longer cycle life at room temperature.\n3. A sleep study found a small gain from a fixed lights-out time.",
  },
  world: {
    pageTitle: "The day, at a walking pace",
    text: "Talks on a grain corridor continued, and the weekly ship schedule stayed posted. A city council published its election calendar and the dates did not move. A weather office kept a flood watch in place and listed the rivers it covers, with the next update set for morning.",
    itemTitle: "The day, without the siren",
    summary:
      "1. Grain-corridor talks continued, with the weekly ship schedule still posted.\n2. A city council published an election calendar and the dates held.\n3. A weather office kept a flood watch and named the rivers it covers.",
  },
};

const SEEDED_AT = "2026-10-19T07:30:00.000Z";

export function fixtureDocument(source: TopicSource): ScrapeDocument {
  const copy = COPY[source.id] ?? COPY.tech;
  return {
    sourceId: source.id,
    sourceName: source.label,
    url: source.url,
    title: copy.pageTitle,
    text: copy.text,
  };
}

export function fixtureItem(source: TopicSource, timestamp = new Date().toISOString()): DigestItem {
  const copy = COPY[source.id] ?? COPY.tech;
  return {
    id: `sample-${source.id}`,
    title: copy.itemTitle,
    summary: copy.summary,
    originalUrl: source.url,
    sourceName: source.label,
    timestamp,
  };
}

export function fixtureSummary(sources: TopicSource[]) {
  const items = sources.map((source) => fixtureItem(source));
  const title = sources.length === 1 ? items[0].title : "A calm brief";
  return {
    title,
    calmScore: 84,
    items,
  };
}

export function seedSession(): DigestSession {
  const sources = [
    { id: "tech", label: "Tech", url: "https://news.ycombinator.com", icon: "cpu", enabled: true },
    { id: "indie", label: "Indie Hackers", url: "https://www.indiehackers.com", icon: "rocket", enabled: true },
    { id: "science", label: "Science", url: "https://www.sciencenews.org", icon: "flask", enabled: true },
  ];
  const items = sources.map((source) => fixtureItem(source, SEEDED_AT));
  const title = "A quieter Monday";
  return {
    id: "6f1c2a40-9b7e-4d1a-8c33-0a1b2c3d4e5f",
    createdAt: SEEDED_AT,
    title,
    calmScore: 86,
    audioUrl: null,
    duration: estimateDuration(buildScript(title, items)),
    items,
  };
}
