import { UnitError } from '../lattice/errors.ts';
import { WIDTH } from './packed.ts';

export function chunkCount(n: number): number {
  if (n <= 0) return 0;
  return Math.ceil(n / WIDTH);
}

export class WideMask {
  readonly words: Uint32Array;
  readonly width: number;

  constructor(width: number, words?: Uint32Array) {
    this.width = width;
    this.words = words ?? new Uint32Array(chunkCount(width));
  }

  static fromTokens(tokens: readonly string[], allowed: ReadonlySet<string>): WideMask {
    const m = new WideMask(tokens.length);
    tokens.forEach((t, i) => {
      if (allowed.has(t)) m.set(i);
    });
    return m;
  }

  set(bit: number): void {
    if (bit < 0 || bit >= this.width) {
      throw new UnitError('MALFORMED', `bit ${bit} is outside a mask of width ${this.width}`, {
        bit,
        width: this.width,
      });
    }
    this.words[bit >> 5] |= 1 << (bit & 31);
  }

  has(bit: number): boolean {
    if (bit < 0 || bit >= this.width) return false;
    return (this.words[bit >> 5] & (1 << (bit & 31))) !== 0;
  }

  and(other: WideMask): WideMask {
    const w = Math.max(this.width, other.width);
    const out = new WideMask(w);
    const n = Math.min(this.words.length, other.words.length);
    for (let i = 0; i < n; i++) out.words[i] = this.words[i] & other.words[i];
    return out;
  }

  or(other: WideMask): WideMask {
    const w = Math.max(this.width, other.width);
    const out = new WideMask(w);
    for (let i = 0; i < out.words.length; i++) {
      out.words[i] = (this.words[i] ?? 0) | (other.words[i] ?? 0);
    }
    return out;
  }

  difference(other: WideMask): WideMask {
    const w = Math.max(this.width, other.width);
    const out = new WideMask(w);
    for (let i = 0; i < out.words.length; i++) {
      out.words[i] = (this.words[i] ?? 0) & ~(other.words[i] ?? 0);
    }
    const spare = w % 32;
    if (spare !== 0 && out.words.length > 0) {
      out.words[out.words.length - 1] &= (1 << spare) - 1;
    }
    return out;
  }

  subsetOf(other: WideMask): boolean {
    const n = Math.max(this.words.length, other.words.length);
    for (let i = 0; i < n; i++) {
      const a = this.words[i] ?? 0;
      const b = other.words[i] ?? 0;
      if ((a & ~b) !== 0) return false;
    }
    return true;
  }

  size(): number {
    let n = 0;
    for (let i = 0; i < this.width; i++) if (this.has(i)) n++;
    return n;
  }

  members(tokens: readonly string[]): readonly string[] {
    return tokens.filter((_, i) => this.has(i));
  }

  static filled(width: number): WideMask {
    const m = new WideMask(width);
    if (width <= 0) return m;
    m.words.fill(0xffffffff);
    const spare = width % 32;
    if (spare !== 0) m.words[m.words.length - 1] = (1 << spare) - 1;
    return m;
  }
}
