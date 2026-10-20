const NOISE =
  /cookie|accept all|subscribe to|sign in to|log in|advertisement|sponsored content|privacy policy|terms of use|all rights reserved|share this|related articles|skip to content|enable javascript|print subscription|full digital access|already a subscriber|newsletter|manage consent|sign up for|follow us on|massachusetts ave/i;

const SCORE = /\b\d+\s+points?\b|\b\d+\s+comments?\b|\bupvotes?\b|\b\d+\s+(?:minutes?|hours?|days?)\s+ago\b/i;

const BYLINE = /^(?:by|posted by)\s+[A-Z]/i;

export type CleanedText = {
  text: string;
  filtered: number;
};

function normalizeLine(line: string): string {
  return line
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#>*_`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isArticleLine(line: string): boolean {
  if (line.length < 28 || BYLINE.test(line)) return false;
  const commas = (line.match(/,/g) ?? []).length;
  if (commas >= 3 && !/[.!?]/.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 5) return false;
  const lowerWords = words.filter((word) => /^[a-z]/.test(word));
  return lowerWords.length >= 2;
}

export function cleanPageText(raw: string): CleanedText {
  const lines = raw.split(/\n+/).map(normalizeLine);
  const kept: string[] = [];
  let filtered = 0;

  for (const line of lines) {
    if (line.length < 28) continue;
    const rejected = !isArticleLine(line) || NOISE.test(line) || SCORE.test(line) || kept.includes(line);
    if (rejected) {
      filtered += 1;
      continue;
    }
    kept.push(line);
    if (kept.length >= 28) break;
  }

  return {
    text: kept.join("\n").slice(0, 6000),
    filtered,
  };
}

export const ARTICLE_EXTRACT_EXPRESSION = `(() => {
  const root = document.body;
  if (!root) return "";
  const clone = root.cloneNode(true);
  clone.querySelectorAll("nav, footer, aside, header, form, iframe, script, style, noscript, [role='navigation'], [role='banner'], [role='contentinfo']").forEach((node) => node.remove());
  const articles = Array.from(clone.querySelectorAll("article"));
  const mains = Array.from(clone.querySelectorAll("main"));
  const scopes = articles.length ? articles : mains.length ? mains : [clone];
  const lines = [];
  for (const scope of scopes) {
    scope.querySelectorAll("h1, h2, h3, p").forEach((node) => {
      if (node.closest("nav, footer, aside, header, form")) return;
      const text = (node.innerText || "").replace(/\\s+/g, " ").trim();
      if (text.length < 28) return;
      lines.push(text);
    });
  }
  return lines.join("\\n");
})()`;
