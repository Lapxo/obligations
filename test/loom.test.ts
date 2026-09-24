import { point } from '@lapxo/obligations';
import { disagree } from '@lapxo/obligations/encounter';
import { agreements, area, centre, density, outliers, pour, red, residual, steady, stretch, sufficient, tense, tighter, width } from '@lapxo/obligations/views/product';
import type { Lock } from '@lapxo/obligations/views/product';
const verdictOf = (place: { readonly seen: readonly { readonly origin: string }[] }): string => {
  const one = new Set(place.seen.map((s) => s.origin)).size < 2;
  return one ? 'grey' : disagree(place as never) ? 'split' : 'agreed';
};
import { sample, throws } from './vectors-harness.ts';
import type { Vector } from './vectors-harness.ts';

type Band = { readonly origin: string; readonly span: { readonly lo: number; readonly hi: number } };

/** One draw, the same on every head: a seed, a line of numbers from it, and a bell made of two of them. */
function draw(seed: number): () => number {
  let held = seed;
  return () => {
    held = (held * 1103515245 + 12345) % 2147483648;
    return held / 2147483648;
  };
}
const bell = (next: () => number, sd: number): number => {
  const u = Math.max(next(), 1e-12);
  return sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
};
const SEED = 20260921;
const band = (origin: string, middle: number, half: number): Band => ({ origin, span: { lo: middle - half, hi: middle + half } });

test('T36-agreement-has-a-resolution — read coarsely three origins meet; read finely the meeting opens into a fork', () => {
  for (const c of sample('yes', 'T36-agreement-has-a-resolution').cases as Vector[]) {
    const next = draw(SEED);
    const truth = Array.from({ length: c['cells'] as number }, () => bell(next, 1));
    const noise = truth.map(() => Array.from({ length: c['origins'] as number }, () => bell(next, c['sd'] as number)));
    const at = (i: number): string => [`c${i}`, ...Array.from({ length: (c['deep'] as number) - 1 }, (_, s) => `s${s}`)].join('/');
    let rising = 0;
    for (const [steps, agreed, forks] of c['seen'] as number[][]) {
      const world = truth.map((t, i) => point(at(i), 0, noise[i]!.map((e, k) => band(`o${k}`, t + e, (c['sd'] as number) / steps!))));
      const got = agreements(world, steps!);
      compare(got.agreed, agreed, `${c.name}: agreed at ${steps}`);
      compare(got.forks, forks, `${c.name}: forks at ${steps}`);
      compare(got.forks >= rising, true, `${c.name}: the fork count never falls as the reading sharpens`);
      rising = got.forks;
    }
    compare(rising === c['cells'], true, `${c.name}: at the finest reading every cell names its own fork`);
    const sharp = truth.map((t, i) => point(at(i), 0, noise[i]!.map((e, k) => band(`o${k}`, t + e, c['sd'] as number))));
    compare(residual(sharp, 1) > 0, true, `${c.name}: the figure the coarsest reading leaves`);
    const enough = sufficient(sharp, c['deep'] as number);
    compare(enough >= 1 && enough <= (c['deep'] as number), true, `${c.name}: the reading it is sufficient at`);
  }
});

test('T37-a-lock-is-a-mould — stretching tells a tight ceiling from a cell no ceiling can hold', () => {
  for (const c of sample('yes', 'T37-a-lock-is-a-mould').cases as Vector[]) {
    const next = draw(SEED);
    const world = Array.from({ length: c['cells'] as number }, (_, i) => {
      const t = bell(next, 1);
      const apart = i % 60 === 0 ? 4 : 0;
      return point(`c${i}`, 0, [0, 1].map((k) => band(`o${k}`, t + k * apart, 0.5)));
    });
    const lock: Lock = new Map(world.map((cell) => [cell.at.join('/'), { lo: -1 + bell(next, 0.3), hi: 1 + bell(next, 0.3) }]));
    for (const [k, count] of c['stretched'] as number[][]) {
      compare(red(world, stretch(lock, k!)).length, count, `${c.name}: red at ${k}`);
    }
    const hard = red(world, stretch(lock, 1024));
    compare(hard.length, c['facts'], `${c.name}: what no ceiling holds at any width`);
    compare(pour(world.slice(0, c['poured'].filled), lock), c['poured'], `${c.name}: what another world fills`);
    const some: Lock = new Map([...lock].slice(0, c['ceilings'] as number));
    let now = some;
    for (let epoch = 0; epoch < (c['epochs'] as number); epoch += 1) now = tense(now, world.slice(0, c['touched'] as number), 0.05);
    compare(tighter(some, now), c['deformed'], `${c.name}: what use made of it`);
  }
});

test('T38-origins-are-a-polygon — two an edge, three an area, four an outlier, five a centre, and beyond that consensus or two cells', () => {
  for (const c of sample('yes', 'T38-origins-are-a-polygon').cases as Vector[]) {
    const next = draw(SEED);
    const one: Band[] = [];
    const both: Band[] = [];
    const held = new Map<number, unknown[]>((c['seen'] as unknown[][]).map((row) => [row[0] as number, row]));
    let narrower = Infinity;
    for (let n = 1; n <= 21; n += 1) {
      one.push(band(`o${n}`, bell(next, c['sd'] as number), 0.6 + Math.abs(bell(next, 0.5))));
      both.push(band(`p${n}`, (n % 2 === 0 ? -3 : 3) + bell(next, 0.2), 1));
      const row = held.get(n);
      if (row === undefined) continue;
      const [, said, meet, figure, apart, centred, other, never] = row as [number, string, number, number, number, boolean, string, number];
      const a = point('c', 0, one);
      const b = point('c', 0, both);
      compare(verdictOf(a), said, `${c.name}: one population at ${n}`);
      compare(Math.abs(width(a) - meet) < 0.005, true, `${c.name}: the meet at ${n}`);
      compare(Math.abs(area(a) - figure) < 0.005, true, `${c.name}: the figure at ${n}`);
      if (n < 4 || area(a) === 0) compare(throws(() => outliers(a), /REFUSE·outliers/), true, `${c.name}: no figure to leave at ${n}`);
      else compare(outliers(a).length, apart, `${c.name}: the origins the others do not enclose at ${n}`);
      compare(steady(a), centred, `${c.name}: the verdict holds without any one of them at ${n}`);
      compare(width(a) <= narrower + 1e-9, true, `${c.name}: the meet never widens as origins are added`);
      narrower = width(a);
      compare(verdictOf(b), other, `${c.name}: two populations at ${n}`);
      compare(width(b), never, `${c.name}: two populations never meet at ${n}`);
      const [x, y] = centre(a);
      compare(x < y, true, `${c.name}: a centre lies where a floor is under a ceiling at ${n}`);
      compare(Math.abs(density(a) * (n > 1 ? n : 1) - area(a)) < 1e-9, true, `${c.name}: the figure per origin at ${n}`);
    }
  }
});

