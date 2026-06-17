/**
 * Normalize OCR text before parsing.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Remove duplicate lines (case-insensitive) while preserving order. */
export function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line.trim());
  }
  return out;
}

export function cleanOcrText(raw: string): string {
  const normalized = normalizeWhitespace(raw);
  const lines = dedupeLines(
    normalized
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
  );
  return lines.join('\n');
}

export function linesFromOcrText(cleaned: string): string[] {
  return cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}
