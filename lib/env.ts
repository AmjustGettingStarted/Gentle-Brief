export function readEnv(name: string): string {
  const raw = process.env[name]?.trim() ?? "";
  const duplicated = `${name}=`;
  if (raw.startsWith(duplicated)) return raw.slice(duplicated.length).trim();
  return raw;
}

export function redact(message: string, secrets: string[]): string {
  let cleaned = message;
  for (const secret of secrets) {
    if (secret.length > 6) cleaned = cleaned.split(secret).join("[redacted]");
  }
  return cleaned.slice(0, 500);
}

export function errorText(error: unknown, secrets: string[] = []): string {
  const message = error instanceof Error ? error.message : String(error);
  return redact(message, secrets);
}
