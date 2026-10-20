type Desk = {
  sourceId: string;
  sourceName: string;
};

const THEMES: Record<string, string> = {
  tech: "Shifts in Open-Source Architecture",
  indie: "Quiet Notes on Building",
  science: "Morning Science & Discovery",
  world: "Perspectives in Global Policy",
  ai: "Shifts in Open-Source Architecture",
  design: "Quiet Reflections on Craft",
  mindset: "Quiet Reflections on Craft",
};

export function briefTitle(rawTitle: string, focus: string, desks: Desk[]): string {
  if (desks.length === 1) {
    const desk = desks[0]?.sourceName.trim() || "Desk";
    return `${desk} Digest: ${threeWordFocus(focus || rawTitle, desks[0])}`;
  }

  return calmTheme(rawTitle) ?? calmTheme(focus) ?? sharedTheme(desks);
}

function calmTheme(value: string): string | null {
  const softened = softenCase(value).replace(/\s+/g, " ").trim();
  if (!softened || softened.includes(",") || softened.includes(";")) return null;
  const words = softened.split(" ").filter(Boolean);
  if (words.length < 3 || words.length > 6) return null;
  return softened;
}

function threeWordFocus(value: string, desk?: Desk): string {
  const source = value.includes(",") || value.includes(";") ? "" : value;
  const words = focusWords(source);
  const chosen = words.length >= 3 ? words.slice(0, 3) : focusWords(themeFocus(desk)).slice(0, 3);
  return chosen.map(capitalize).join(" ");
}

function focusWords(value: string): string[] {
  return softenCase(value)
    .replace(/[^\p{L}\p{N}&'\- ]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word && word !== "&" && !/^(digest|the|a|an|and|on|of|for|in)$/i.test(word));
}

function themeFocus(desk?: Desk): string {
  if (!desk) return "Quiet Morning Notes";
  return THEMES[desk.sourceId] ?? "Quiet Morning Notes";
}

function sharedTheme(desks: Desk[]): string {
  const themes = [...new Set(desks.map((desk) => THEMES[desk.sourceId]).filter(Boolean))];
  if (themes.length === 1) return themes[0];
  return "A Quieter Morning Brief";
}

function softenCase(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (!letters || letters !== letters.toUpperCase()) return trimmed;
  return trimmed
    .toLowerCase()
    .replace(/(^|[\s&/-])(\p{L})/gu, (_, boundary: string, letter: string) => boundary + letter.toUpperCase());
}

function capitalize(word: string): string {
  if (!word) return word;
  if (word === "&") return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}
