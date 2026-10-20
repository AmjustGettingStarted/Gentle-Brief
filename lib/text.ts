const NOISE =
  /cookie|accept all|subscribe|sign in|log in|advertisement|sponsored|newsletter|privacy policy|terms of use|all rights reserved|share this|related articles|skip to content|enable javascript/i;

export function cleanPageText(raw: string): string {
  const lines = raw
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 24 && !NOISE.test(line));

  const unique: string[] = [];
  for (const line of lines) {
    if (unique.includes(line)) continue;
    unique.push(line);
    if (unique.length >= 24) break;
  }

  return unique.join("\n").slice(0, 5000);
}
