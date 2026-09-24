import { disagree, meetAt, origins, potential } from '../../field/encounter.ts';
import type { Point, Sighting } from '../../field/field.ts';

export type Vertex = readonly [number, number];

/**
 * The origins of a cell as the vertices of one polygon: a bound has two poles, so an origin is a place on the plane
 * they make, and what the origins hold together is the figure they enclose. Nothing here knows what the poles measure.
 */
export function vertices(cell: Point): readonly Vertex[] {
  const held = new Map<string, Vertex>();
  for (const seen of cell.seen) held.set(seen.origin, [seen.span.lo, seen.span.hi]);
  return [...held.values()];
}

export function hull(cell: Point): readonly Vertex[] {
  const said = [...vertices(cell)].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  if (said.length < 3) return said;
  const turn = (o: Vertex, a: Vertex, b: Vertex): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const side = (order: readonly Vertex[]): Vertex[] => {
    const out: Vertex[] = [];
    for (const one of order) {
      while (out.length > 1 && turn(out[out.length - 2]!, out[out.length - 1]!, one) <= 0) out.pop();
      out.push(one);
    }
    out.pop();
    return out;
  };
  return [...side(said), ...side([...said].reverse())];
}

export function area(cell: Point): number {
  const ring = hull(cell);
  if (ring.length < 3) return 0;
  let twice = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[(i + 1) % ring.length]!;
    twice += x1 * y2 - x2 * y1;
  }
  return Math.abs(twice) / 2;
}

export function centre(cell: Point): Vertex {
  const said = vertices(cell);
  if (!said.length) return [0, 0];
  return [said.reduce((s, v) => s + v[0], 0) / said.length, said.reduce((s, v) => s + v[1], 0) / said.length];
}

const without = (cell: Point, origin: string): Point =>
  ({ ...cell, seen: cell.seen.filter((s: Sighting) => s.origin !== origin) });

/** An origin outside what the others enclose: take it away and the figure shrinks, so what it says is its own. */
export function outliers(cell: Point): readonly string[] {
  if (origins(cell) < 4) throw new Error('REFUSE·outliers fewer than four origins enclose no figure a leaving one could shrink');
  const whole = area(cell);
  if (whole === 0) throw new Error('REFUSE·outliers the origins lie on one line: the figure has no interior, so none of them is outside it');
  return [...new Set(cell.seen.map((s) => s.origin))].filter((origin) => area(without(cell, origin)) < whole - 1e-12);
}

/** A cell with a centre: no origin decides it alone, so taking any one away leaves the verdict where it was. */
export function steady(cell: Point): boolean {
  if (origins(cell) < 5) return false;
  const said = (one: Point): string => (potential(one) ? 'one' : disagree(one) ? 'apart' : 'together');
  const held = said(cell);
  return [...new Set(cell.seen.map((s) => s.origin))].every((origin) => said(without(cell, origin)) === held);
}

export function width(cell: Point): number {
  const held = meetAt(cell);
  return held.hi < held.lo ? 0 : held.hi - held.lo;
}

export function density(cell: Point): number {
  return origins(cell) === 0 ? 0 : area(cell) / origins(cell);
}
