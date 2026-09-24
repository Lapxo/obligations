import type { Scale } from '../types.ts';

export type Attainability =
  | { readonly kind: 'attainable'; readonly value: string }
  | { readonly kind: 'hole'; readonly value: string; readonly after: string; readonly before: string }
  | { readonly kind: 'unknown'; readonly value: string };

const trailing = (name: string): { stem: string; n: number } | null => {
  const m = name.match(/^(.*?)(\d+)$/);
  if (!m) return null;
  return { stem: m[1], n: Number(m[2]) };
};

export function attainable(c: Scale): {
  readonly values: readonly string[];
  readonly holes: readonly { readonly value: string; readonly after: string; readonly before: string }[];
} {
  const holes: { value: string; after: string; before: string }[] = [];
  const byStem = new Map<string, { name: string; n: number }[]>();
  for (const name of c.levels) {
    const t = trailing(name);
    if (!t) continue;
    const list = byStem.get(t.stem) ?? [];
    list.push({ name, n: t.n });
    byStem.set(t.stem, list);
  }
  for (const [stem, list] of byStem) {
    list.sort((a, b) => a.n - b.n);
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i];
      const b = list[i + 1];
      for (let n = a.n + 1; n < b.n; n++) {
        holes.push({ value: `${stem}${n}`, after: a.name, before: b.name });
      }
    }
  }
  return { values: c.levels, holes };
}

export function classifyValue(c: Scale, value: string): Attainability {
  if (c.levels.includes(value)) return { kind: 'attainable', value };
  const found = attainable(c).holes.find((h) => h.value === value);
  if (found) return { kind: 'hole', value, after: found.after, before: found.before };
  return { kind: 'unknown', value };
}
