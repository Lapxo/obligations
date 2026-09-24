function stream(seed: number): () => number {
  let s = (Math.imul(seed + 1, 2654435761) ^ 0x5f3759df) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

export function unitStream(seed: number): () => number {
  const next = stream(seed);
  return () => next() / 4294967296;
}

export function permute<T>(xs: readonly T[], salt: number): T[] {
  const next = stream(salt);
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    const t = out[i]!;
    out[i] = out[j]!;
    out[j] = t;
  }
  return out;
}

export function permutationBlind<T, R>(
  values: readonly T[],
  claim: (xs: readonly T[]) => R,
  draws = 8,
): boolean {
  const want = JSON.stringify(claim(values));
  for (let d = 0; d < draws; d++) {
    if (JSON.stringify(claim(permute(values, d + 1))) !== want) return false;
  }
  return true;
}
