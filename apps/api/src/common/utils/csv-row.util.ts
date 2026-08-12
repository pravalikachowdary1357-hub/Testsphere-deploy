export interface RowFieldSpec {
  key: string;
  aliases: string[];
  required?: boolean;
  default?: string;
}

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Maps a raw CSV row (arbitrary header casing/spacing) onto the field keys a
// service expects, applying defaults and flagging missing required fields —
// shared so every bulk-import endpoint tolerates the same header variations.
export function extractRow(
  row: Record<string, unknown>,
  specs: RowFieldSpec[],
): { values: Record<string, string>; errors: string[] } {
  const normalized = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) normalized.set(normalizeHeader(key), text);
  }

  const values: Record<string, string> = {};
  const errors: string[] = [];

  for (const spec of specs) {
    let found: string | undefined;
    for (const alias of spec.aliases) {
      const value = normalized.get(alias);
      if (value) {
        found = value;
        break;
      }
    }
    if (!found && spec.default !== undefined) found = spec.default;
    if (!found) {
      if (spec.required) errors.push(`Missing required "${spec.key}"`);
      continue;
    }
    values[spec.key] = found;
  }

  return { values, errors };
}
