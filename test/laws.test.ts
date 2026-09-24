const STATES = ['FREE', 'REQUIRED', 'FORBIDDEN', 'CONFLICT'];
import { alphabets, chain, coarsen, contracts, converge, endsBeforeNow, foldIn, foldSigned, freedom, frontier, intervals, latest, meetAt, origins, point, potential, present, region, resolution, size, state, sufficientResolution, unit, within, yieldOf } from '@lapxo/obligations';
import type { Level, Region, Scale, Sighting } from '@lapxo/obligations';
import { disagree } from '@lapxo/obligations/encounter';
import { c_n, costOfState, price } from '@lapxo/obligations/price';
import { replay } from '@lapxo/obligations/replay';
const verdictOf = (place: { readonly seen: readonly { readonly origin: string }[] }): string => {
  const one = new Set(place.seen.map((s) => s.origin)).size < 2;
  return one ? 'grey' : disagree(place as never) ? 'split' : 'agreed';
};
import { b2, heightWorth, n5, productOfChains, sample, squareWorth } from './vectors-harness.ts';
import type { Vector } from './vectors-harness.ts';

/** Each law's own samples, in the six words of the wire: a case holds when the algebra agrees with it, a falsifier by the algebra refusing it. */
const SPAN = intervals(-Infinity, Infinity);
const SAID: Readonly<Record<string, string>> = { grey: 'potential', agreed: 'fact', split: 'fork' };
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const band = (span: readonly number[]): { lo: number; hi: number } => ({ lo: span[0]!, hi: span[1]! });
const holds = (c: Vector, ok: boolean): boolean => compare(ok, true, c);
const chainOf = (n: number): Scale => chain(Array.from({ length: n }, (_, i) => `l${i}`));
const bitsOn = (s: Scale, span: readonly number[]): number => freedom(s, unit('x', { floor: `l${span[0]}`, ceiling: `l${span[1]}` }));
const seen = (named: readonly (readonly [string, readonly number[]])[]): Sighting[] => named.map(([origin, span]) => ({ origin, span: band(span) }));
const rotations = <T>(xs: readonly T[]): T[][] => [...xs.map((_, i) => [...xs.slice(i), ...xs.slice(0, i)]), [...xs].reverse()];

function each(v: Vector, check: (c: Vector) => boolean): void {
  for (const c of v.cases as Vector[]) check(c);
}
const both = (law: string, check: (c: Vector) => boolean): void => {
  each(sample('yes', law), check);
  each(sample('no', law), check);
};

const fits = (c: Vector): boolean => {
  if (c.form === 'interval') return holds(c, SPAN.leq(band(c.interval[0]), band(c.interval[1])) === c.expect);
  return holds(c, (state(chainOf(c.resolution), unit('x', { floor: `l${c.interval[0]}`, ceiling: `l${c.interval[1]}` })) !== 'CONFLICT') === c.expect);
};
const encounter = (c: Vector): boolean => {
  const p = point(c.coordinate, c.epoch ?? 0, seen(c.origins));
  return holds(c, (c.resolution === undefined || resolution(p) === c.resolution) && SAID[verdictOf(p)] === c.expect);
};
const meets = (c: Vector): boolean => holds(c, rotations((c.interval as number[][]).map(band)).every((o) => same(foldIn(SPAN, o), band(c.expect))));
const refinement = (c: Vector): boolean => (c.resolution !== undefined
  ? holds(c, sufficientResolution(c.resolution, (steps: number) => size(c.coordinate, steps)) === c.expect)
  : holds(c, within(region(c.coordinate[0]), region(c.coordinate[1])) === c.expect));
const causal = (c: Vector): boolean => {
  const points = (c.origins as [string, number, number[]][]).map(([origin, epoch, span]) => point(c.coordinate, epoch, [{ origin, span: band(span) }]));
  return holds(c, rotations(points).every((order) => {
    const got = latest(order);
    return got !== null && got.epoch === c.expect[0] && same(got.seen[0]?.span, band(c.expect[1]));
  }));
};
const extensions = (c: Vector): boolean => {
  const sets = (c.origins as [string, [string, number[]][]][]).map(([, held]) => ({
    polarity: 'permit' as const, values: new Set(held.map(([at, span]) => `${at}=${span[0]}..${span[1]}`)),
  }));
  return holds(c, foldSigned(alphabets(), sets).classes.length === c.expect);
};
const vacuity = (c: Vector): boolean => {
  if (typeof c.coordinate === 'string') {
    return holds(c, origins(point(c.coordinate, 0, (c.origins as [string, number][]).map(([origin]) => ({ origin, span: SPAN.top })))) === c.expect);
  }
  const [now, window] = c.epoch as [number, number];
  const touched = (c.origins as [string, string, number][]).filter(([, , epoch]) => epoch >= now - window).map(([, at, epoch]) => point(at, epoch));
  return holds(c, contracts((c.coordinate as string[]).map((r) => region(r)), touched) === c.expect);
};
const conserved = (c: Vector): boolean => {
  const s = chainOf(c.interval[1] + 1);
  const cells = Array.from({ length: c.coordinate as number }, () => [c.interval[0], c.interval[1]] as [number, number]);
  const total = (): number => cells.reduce((sum, cell) => sum + bitsOn(s, cell), 0);
  const totals = [total()];
  for (let epoch = 0; epoch < c.epoch; epoch++) {
    for (let k = 0; k < c.origins; k++) {
      const cell = cells[(epoch * c.origins + k) % cells.length]!;
      cell[1] = Math.floor((cell[0] + cell[1]) / 2);
    }
    totals.push(total());
  }
  const rises = totals.some((t, i) => i > 0 && t > totals[i - 1]!);
  const trend = rises ? 'rises' : totals[totals.length - 1]! < totals[0]! ? 'decreases' : 'holds';
  return holds(c, trend === c.expect);
};
const existence = (c: Vector): boolean => {
  const met = (c.origins as [string, string, number][]).filter(([, at, epoch]) => at === c.coordinate && epoch === c.epoch).map(([origin]) => ({ origin, span: SPAN.top }));
  const here = point(c.coordinate, c.epoch, met);
  return holds(c, (origins(here) === 0 ? 'empty' : potential(here) ? 'potential' : 'exists') === c.expect);
};
const states = (c: Vector): boolean => {
  const s = c.form === 'diamond' ? b2() : chainOf(c.resolution);
  const [floor, ceiling] = c.form === 'diamond' ? c.interval as string[] : (c.interval as number[]).map((i) => `l${i}`);
  const got = state(s, unit('x', { floor: floor!, ceiling: ceiling! }));
  return holds(c, got === c.expect && STATES.includes(got));
};
const debit = (c: Vector): boolean => {
  const bits = (span: number[]): number => bitsOn(chainOf(Math.max(span[0]!, span[1]!) + 1), span);
  if (typeof c.expect === 'number') return holds(c, Math.abs(bits(c.interval) - c.expect) < 1e-3);
  const [a, b] = (c.interval as number[][]).map(bits);
  return holds(c, (a === b ? 'equal' : 'unequal') === c.expect);
};
const presentMeet = (c: Vector): boolean => {
  const got = present(point('x', c.epoch, seen(c.origins)));
  return holds(c, same(got, Array.isArray(c.expect) ? band(c.expect) : c.expect));
};
const bitsTravel = (c: Vector): boolean => {
  const [before, after] = c.interval as number[][];
  const s = chainOf(before![1]! + 1);
  return holds(c, Math.abs(bitsOn(s, before!) - bitsOn(s, after!) - c.expect) < 0.01);
};
const splits = (c: Vector): boolean => {
  const p = point(c.coordinate, 0, seen(c.origins));
  const got = disagree(p);
  return holds(c, resolution(p) === c.resolution && same(got ? [got[0].origin, got[1].origin] : null, c.expect));
};
const coarsening = (c: Vector): boolean => {
  const [claim, ...regions] = c.coordinate as string[];
  const reach = (from: Region): number => regions.filter((r) => within(region(r), from)).length;
  const fine = reach(region(claim!));
  const coarse = reach(coarsen(point(claim!), c.resolution));
  return holds(c, fine === c.expect[0] && coarse === c.expect[1] && coarse >= fine);
};
const convergence = (c: Vector): boolean => {
  if (Array.isArray(c.interval[0])) return holds(c, endsBeforeNow(c.epoch, c.interval[0], c.interval[1]) === c.expect);
  return holds(c, converge(c.interval[1] - c.interval[0], c.origins[0], c.origins[1], c.epoch).trend === c.expect);
};
const sufficiency = (c: Vector): boolean => holds(c, sufficientResolution(c.resolution, (steps: number) => size(c.coordinate, steps)) === c.expect);
const questions = (c: Vector): boolean => {
  const heard = new Map<string, Set<string>>();
  for (let i = 0; i < c.origins; i++) {
    const at = `q/${i % c.coordinate}`;
    heard.set(at, (heard.get(at) ?? new Set<string>()).add(`o${Math.floor(i / c.coordinate)}`));
  }
  const met = [...heard].filter(([at, by]) => !potential(point(at, 0, [...by].map((origin) => ({ origin, span: SPAN.top }))))).map(([at]) => at);
  return holds(c, size(met) === c.expect);
};
const reliability = (c: Vector): boolean => {
  const [claims, met] = c.origins as number[];
  const facts = Array.from({ length: claims! }, (_, i) => point(`${c.coordinate}/${i}`, 0, i < met!
    ? [{ origin: 'x', span: { lo: 0, hi: 5 } }, { origin: 'y', span: { lo: 2, hi: 9 } }]
    : [{ origin: 'x', span: { lo: 0, hi: 5 } }])).filter((p) => verdictOf(p) === 'agreed').length;
  return holds(c, Math.abs(facts / claims! - c.expect) < 1e-9);
};
const extremal = (c: Vector): boolean => holds(c, c_n(c.resolution) >= c.interval[0] - 1e-9 && c_n(c.resolution) <= c.interval[1] + 1e-9);
const inequality = (c: Vector): boolean => {
  const s = chainOf(c.resolution);
  const met = foldIn(SPAN, (c.interval as number[][]).map(band));
  const drop = bitsOn(s, c.interval[0]) - bitsOn(s, [met.lo, met.hi]);
  const [before, after] = c.states as [number, number];
  return holds(c, Math.abs(drop - c.expect) < 1e-3
    && (drop >= 1 - 1e-9) === (after * 2 <= before) && (drop < 1e-9) === (after === before));
};
const currency = (c: Vector): boolean => {
  if (c.expect === 'scarce') return conserved({ ...c, expect: 'decreases' });
  if (c.expect === 'unforgeable') {
    const s = chainOf(c.resolution);
    return holds(c, (yieldOf(s, acts(c))[0]?.closed ?? 0) <= bitsOn(s, c.interval));
  }
  if (c.expect === 'measurable') return holds(c, bitsOn(chainOf(c.resolution), c.interval) === 4);
  if (c.expect === 'transferable') {
    const got = foldSigned(SPAN, (c.interval as number[][]).map(band));
    return holds(c, got.standing.length === 1 && !got.fork);
  }
  const p = point(c.coordinate, 0, (c.interval as number[][]).map((span, i) => ({ origin: `o${i}`, span: band(span) })));
  return holds(c, same(replay([p], region(''), (met) => meetAt(met[0]!)).map((f) => f.value), [meetAt(p)]));
};
const lcm = (a: number, b: number): number => {
  const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
  return (a / gcd(a, b)) * b;
};
const spectrumOf = (c: Vector): boolean => {
  if (c.epoch) {
    const [first, second] = c.epoch as number[];
    let met = 0;
    for (let hour = 0; hour < c.resolution; hour += 1) {
      const bands = [first!, second!].map((period, i) => ({ origin: `o${i}`, span: { lo: Math.floor(hour / period) * period, hi: Math.floor(hour / period) * period + period } }));
      const when = present(point('h', 0, bands));
      if (when !== null && bands.every((b) => b.span.lo === hour)) met += 1;
    }
    return holds(c, met === c.expect && met === Math.ceil(c.resolution / lcm(first!, second!)));
  }
  const prefixes = c.resolution as number;
  const lost = Array.from({ length: c.coordinate as number }, (_, i) => `p/${Math.floor(Math.sqrt((i * prefixes * prefixes) / c.coordinate)) % prefixes}/${i}`);
  const counted = new Map<string, number>();
  for (const at of lost) counted.set(at.split('/').slice(0, 2).join('/'), (counted.get(at.split('/').slice(0, 2).join('/')) ?? 0) + 1);
  const claims = [...counted].sort((a, b) => b[1] - a[1]).slice(0, c.origins as number).map(([at]) => region(at));
  return holds(c, lost.filter((at) => claims.some((claim) => within(point(at), claim))).length === c.expect);
};
const opens = (n: number): { at: ReturnType<typeof point>; bound: ReturnType<typeof unit>; dependents: string[]; closers: { by: string; cost: number }[] }[] =>
  Array.from({ length: n }, (_, i) => ({
    at: point(`open/${i}`),
    bound: unit(`open/${i}`, i % 3 === 0 ? { floor: 'b', ceiling: 'c' } : { floor: 'none', ceiling: 'all' }),
    dependents: Array.from({ length: (i * 3) % 5 }, (_, k) => `d${k}`),
    closers: [{ by: `by${i % 7}`, cost: 1 + (i % 4) }],
  }));
const ignorance = (c: Vector): boolean => {
  const open = frontier(n5(), (i: Level) => i, opens(c.coordinate as number));
  const worth = (o: { premium: number; dependents: number; cost: number | null }): number => (o.premium * (1 + o.dependents)) / (o.cost ?? 1);
  const whole = open.reduce((sum, o) => sum + o.premium * (1 + o.dependents), 0);
  const top = [...open].sort((a, b) => worth(b) - worth(a)).slice(0, Math.round(open.length / (c.resolution as number)));
  return holds(c, Math.round((top.reduce((sum, o) => sum + o.premium * (1 + o.dependents), 0) / whole) * 100) === c.expect);
};
const earning = (c: Vector): boolean => {
  const base = c.coordinate as number;
  const window = c.resolution as number;
  const rules = Array.from({ length: base }, (_, i) => ({ at: `rule/${i}`, cited: i % 5 !== 0, moved: i < base * 0.7 ? 0 : -window - 1 }));
  let byCitation = 0;
  let byVerdict = 0;
  let first = 0;
  for (let epoch = 1; epoch <= c.epoch; epoch += 1) {
    for (let k = 0; k < (c.origins as number); k += 1) rules.push({ at: `rule/${rules.length}`, cited: false, moved: epoch });
    for (const rule of rules) if (rule.moved >= 0 && (epoch % 3 === 0 || rule.moved === epoch)) rule.moved = epoch;
    const touched = rules.filter((rule) => epoch - rule.moved <= window).map((rule) => point(rule.at, epoch));
    byCitation = rules.filter((rule) => !rule.cited).length;
    byVerdict = rules.filter((rule) => contracts([region(rule.at)], touched)).length;
    if (epoch === 1) first = byCitation;
  }
  return holds(c, same([first, byCitation, byVerdict], c.expect));
};
const knowing = (c: Vector): boolean => {
  let cells = c.coordinate as number;
  let fromForks = 0;
  let grey = 0;
  for (let epoch = 1; epoch <= c.epoch; epoch += 1) {
    const split = point(`q/${epoch}`, epoch, epoch % (c.resolution as number) === 0
      ? [{ origin: 'x', span: { lo: 0, hi: 4 } }, { origin: 'y', span: { lo: 6, hi: 9 } }]
      : [{ origin: 'x', span: { lo: 0, hi: 9 } }, { origin: 'y', span: { lo: 2, hi: 8 } }]);
    if (disagree(split) !== null) { cells += 1; fromForks += 1; }
    if (epoch % 101 === 0) grey += 1;
  }
  return holds(c, same([cells, fromForks, grey], c.expect));
};
const provoking = (c: Vector): boolean => {
  const budget = c.resolution as number;
  const pop = Array.from({ length: c.coordinate as number }, (_, i) => ({ premium: (i * 5) % 13, cost: 1 + (i % 3) }));
  const spend = (order: typeof pop, gaze: boolean): { closed: number; made: number } => {
    let spent = 0;
    let closed = 0;
    let made = 0;
    for (const cell of order) {
      if (spent + cell.cost > budget) break;
      spent += cell.cost;
      closed += 1;
      if (gaze && cell.premium >= 11) { made += 1; spent += 1; closed += 1; }
    }
    return { closed, made };
  };
  const byWorth = [...pop].sort((a, b) => b.premium / b.cost - a.premium / a.cost);
  const base = spend(pop, false);
  const gaze = spend(byWorth, false);
  const both = spend(byWorth, true);
  return holds(c, same([base.closed, gaze.closed, both.closed, both.made], c.expect)
    && gaze.closed > base.closed && both.closed > gaze.closed);
};
const uncertainty = (c: Vector): boolean => {
  const products = (c.resolution as number[]).map((depth, i) => depth * (c.origins as number[])[i]!);
  return holds(c, products.every((product) => product >= c.expect - 1e-9));
};
const signed = (c: Vector): boolean => {
  const values = (c.interval as number[][]).map(band);
  const got = foldSigned(SPAN, values);
  return holds(c, same(got.standing.map((k) => values[got.classes[k]![0]!]), (c.expect as number[][]).map(band)));
};
const age = (c: Vector): boolean => {
  const [last, now] = c.epoch as number[];
  const met = Array.from({ length: c.origins }, (_, i) => point(c.coordinate, last! + 1 + (i % (now! - last!)), [
    { origin: 'x', span: SPAN.top }, { origin: 'y', span: SPAN.top },
  ]));
  return holds(c, met.filter((p) => p.epoch > last! && !potential(p)).length === c.expect);
};
const distance = (c: Vector): boolean => {
  const [a, b] = (c.origins as [string, string[]][]).map(([, held]) => held);
  const union = new Set([...a!, ...b!]).size;
  return holds(c, Math.abs(1 - a!.filter((x) => b!.includes(x)).length / union - c.expect) < 1e-3);
};
const bootstrap = (c: Vector): boolean => holds(c, foldSigned(SPAN, (c.origins as [string, number[]][]).map(([, span]) => band(span))).fork === c.expect);
const retreat = (c: Vector): boolean => {
  const [shape, worth] = c.form as [string, string];
  const s = shape === 'chain5' ? chainOf(5) : shape === 'diamond' ? b2() : n5();
  const value = worth === 'height' ? heightWorth(s) : squareWorth;
  const u = s.rank(c.interval[0]);
  const w = s.rank(c.interval[1]);
  const m = s.lower(u, w);
  const cost = (x: Level): number => {
    const got = costOfState(s, value, u, w, x);
    return got.shortfall + got.overshoot;
  };
  const between = (a: Level, b: Level): boolean => s.levels.some((_, t) => t !== a && t !== b && s.leq(a, t) && s.leq(t, b));
  const covers = s.levels.map((_, x) => x).filter((x) => x !== m && ((s.leq(m, x) && !between(m, x)) || (s.leq(x, m) && !between(x, m))));
  return holds(c, covers.length > 0 && covers.every((x) => cost(m) <= cost(x) + 1e-9));
};
const additive = (c: Vector): boolean => {
  const [dims, worth] = c.form as [number[], string];
  const f = (i: number): number => (worth === 'height' ? i : i * i);
  const whole = productOfChains(dims);
  const [u, w] = c.interval as number[][];
  const joint = price(whole, (x) => whole.levels[x]!.split(',').reduce((sum, k) => sum + f(Number(k)), 0), whole.rank(u!.join(',')), whole.rank(w!.join(',')));
  const parts = dims.map((d, i) => {
    const s = chainOf(d);
    return price(s, f, s.rank(`l${u![i]}`), s.rank(`l${w![i]}`));
  });
  const sum = (key: 'coarse' | 'best'): number => parts.reduce((t, p) => t + p[key], 0);
  return holds(c, (Math.abs(joint.coarse - sum('coarse')) < 1e-9 && Math.abs(joint.best - sum('best')) < 1e-9) === c.expect);
};

const fourStates = (c: Vector): boolean => {
  const p = point('cell', 0, seen(c.origins));
  const met = meetAt(p);
  const fits = met.lo <= met.hi;
  const name = origins(p) >= 2 ? (fits ? 'FREE' : 'CONFLICT') : (fits ? 'REQUIRED' : 'FORBIDDEN');
  return holds(c, name === c.expect && new Set(STATES).size === 4);
};
const oneRelation = (c: Vector): boolean => holds(c, same(meetAt(point(c.coordinate, 0, seen(c.origins))), band(c.expect)));
const acts = (c: Vector): { by: string; epoch: number; before: ReturnType<typeof unit>; after: ReturnType<typeof unit> }[] =>
  (c.origins as [string, number, number[], number[]][]).map(([by, epoch, before, after]) => ({
    by,
    epoch,
    before: unit('a', { floor: `l${before[0]}`, ceiling: `l${before[1]}` }),
    after: unit('a', { floor: `l${after[0]}`, ceiling: `l${after[1]}` }),
  }));
const yields = (c: Vector): boolean => holds(c, same(
  yieldOf(chainOf(c.resolution), acts(c)).map((y) => [y.by, y.epoch, y.closed, y.reopened, y.acts]), c.expect,
));
const scaleOf = (shape: string): Scale => (shape === 'pentagon' ? n5() : shape === 'diamond' ? b2() : chainOf(5));
const worthOf = (shape: string, worth: string): ((i: Level) => number) =>
  (worth === 'count' ? (i: Level) => i : worth === 'height' ? heightWorth(scaleOf(shape)) : squareWorth);
const askedAt = (c: Vector): boolean => {
  const [shape, worth] = c.form as [string, string];
  const [at, ...dependents] = c.coordinate as string[];
  const [floor, ceiling] = c.interval as string[];
  const got = frontier(scaleOf(shape), worthOf(shape, worth), [{
    at: point(at!, 0, c.epoch === undefined ? [] : [{ origin: 'o', span: { lo: 0, hi: 1 } }]),
    bound: unit(at!, { floor: floor!, ceiling: ceiling! }),
    dependents,
    closers: (c.origins as [string, number][]).map(([by, cost]) => ({ by, cost })),
  }]).map((o) => [o.at, o.resolution, o.premium, o.dependents, o.closer, o.cost]);
  return holds(c, same(got, c.expect === null ? [] : [c.expect]));
};
const idempotent = (c: Vector): boolean => {
  const once = foldIn(SPAN, (c.interval as number[][]).map(band));
  return holds(c, same(once, band(c.expect)) && same(foldIn(SPAN, [once]), once));
};
const density = (c: Vector): boolean => holds(c, Array.from({ length: c.origins }, (_, i) => point(`r/${i}`, 0, [
  { origin: `reader${i}`, span: { lo: 0, hi: 10 } }, { origin: 'held', span: { lo: 2, hi: 8 } },
])).filter((p) => disagree(p) === null).length === c.expect);
const superposition = (c: Vector): boolean => {
  const when = present(point('q', 0, (c.epoch as number[][]).map((b, i) => ({ origin: `o${i}`, span: band(b) }))));
  if (when === null) return holds(c, c.expect === 'none');
  const p = point('q', 0, (c.interval as number[][]).map((v, i) => ({ origin: `o${i}`, span: band(v) })));
  return holds(c, verdictOf(p) === 'split' ? c.expect === 'fork' : same(meetAt(p), band(c.expect)));
};

test('A0-carrier — a floor within its ceiling is a cell; a floor wider than its ceiling holds no state', () => both('A0-carrier', fits));
test('A8-four-states — two origins and a fit give exactly four states', () => both('A8-four-states', fourStates));
test('A9-everything-is-a-bound — a cell, a key, a lock and a law fold by one relation', () => both('A9-everything-is-a-bound', oneRelation));
test('D9-yield — bits closed minus bits reopened, per act and epoch', () => each(sample('yes', 'D9-yield'), yields));
test('D10-open-question — a signed ceiling no origin has touched, with its premium and cheapest closer', () => each(sample('yes', 'D10-open-question'), askedAt));
test('T9-self-application-converges — folding a fold changes nothing', () => each(sample('yes', 'T9-self-application'), idempotent));
test('T21-reading-is-an-origin — undisputed readings are the density', () => each(sample('yes', 'T21-reading-is-an-origin'), density));
test('T22-fold-is-superposition — epochs meet, then values meet, or there is no encounter', () => each(sample('yes', 'T22-fold-is-superposition'), superposition));
test('A1-encounter — one origin is potential, two that meet a fact', () => both('A1-encounter', encounter));
test('A2-meet — two bounds fold by their meet, in any order of arrival', () => both('A2-meet', meets));
test('A3-resolution — a longer prefix refines, and a verdict settles at a coarsest depth', () => both('A3-resolution', refinement));
test('A4-epoch — what stands is the latest epoch, whatever the order of arrival', () => both('A4-epoch', causal));
test('A5-origin-is-extension — equal extensions are one origin', () => both('A5-origin-is-extension', extensions));
test('A6-vacuity — a region no recent origin touches contracts, and weight never rises without one', () => both('A6-vacuity', vacuity));
test('A7-freedom-conserved — encounters with no new coordinate only lower the freedom', () => both('A7-freedom-conserved', conserved));
test('D0-coordinate — a coordinate exists where two origins meet at one epoch', () => each(sample('yes', 'D0-coordinate'), existence));
test('D3-state — four states, read off the floor and the ceiling', () => each(sample('yes', 'D3-state'), states));
test('D4-debit-in-bits — the debit is log2 of the states between floor and ceiling', () => each(sample('yes', 'D4-debit-in-bits'), debit));
test('D8-present — the present is the meet of the bands', () => each(sample('yes', 'D8-present'), presentMeet));
test('T1-only-verdict-bits-travel — a claim moves a verdict by the bits it reduces', () => both('T1-only-verdict-bits-travel', bitsTravel));
test('T2-coordinate-where-disagree — two origins that do not meet name the pair', () => each(sample('yes', 'T2-coordinate-where-disagree'), splits));
test('T5-coarsen-widens — read coarser, a claim reaches no fewer regions', () => both('T5-coarsen-widens', coarsening));
test('T6-present-converges — the width moves by maturation minus forgetting', () => both('T6-present-converges', convergence));
test('T7-sufficient-resolution — a coarsest resolution still moves the verdict', () => {
  each(sample('yes', 'T7-sufficient-resolution'), sufficiency);
  each(sample('no', 'A3-resolution'), refinement);
});
test('T10-drift — two homes agree, then diverge, and the divergence shows at the encounter', () => both('T10-drift', encounter));
test('T11-size-is-questions — the size is the count of distinct questions with an encounter', () => both('T11-size-is-questions', questions));
test('T12-reliability-is-encounter-rate — the fact share of a region is its second-origin rate', () => both('T12-reliability-is-encounter-rate', reliability));
test('T13-c_n — the conservativeness bound at n states', () => each(sample('yes', 'T13-c_n'), extremal));
test('T16-encounter-inequality — a second origin never raises the debit: a full bit exactly when it admits half, nothing exactly when it narrows nothing', () => both('T16-encounter-inequality', inequality));
test('T18-freedom-is-a-currency — scarce, unforgeable, measurable, transferable, verifiable', () => each(sample('yes', 'T18-freedom-is-a-currency'), currency));
test('T23-domain-has-a-spectrum — two periods meet at their common multiple, and a coarse claim recovers the fine cells under it', () => each(sample('yes', 'T23-domain-has-a-spectrum'), spectrumOf));
test('T24-ignorance-has-coordinates — the open questions rank by premium, dependents and cost', () => each(sample('yes', 'T24-ignorance-has-coordinates'), ignorance));
test('T25-rules-earn-their-place — vacuity by citation grows while vacuity by verdict converges', () => each(sample('yes', 'T25-rules-earn-their-place'), earning));
test('T26-knowing-has-four-states — cells are born from forks', () => each(sample('yes', 'T26-knowing-has-four-states'), knowing));
test('T27-disagreement-can-be-provoked — provoking closes more and names coordinates that were not there', () => each(sample('yes', 'T27-disagreement-can-be-provoked'), provoking));
test('H1-uncertainty — resolution times independent encounters per cell stays above c', () => both('H1-uncertainty', uncertainty));
test('T19-signatures-fold — the narrower stands, the incomparable fork', () => each(sample('yes', 'T19-signatures-fold'), signed));
test('T20-age-is-encounters — age counts encounters, never the clock', () => both('T20-age-is-encounters', age));
test('C1-independence-is-distance — independence is the distance between extensions', () => each(sample('yes', 'C1-independence-is-distance'), distance));
test('C3-bootstrap-once — a second single-origin claim in one generation is a fork', () => each(sample('yes', 'C3-bootstrap-once'), bootstrap));
test('thm-extremal — c_n at n states', () => each(sample('yes', 'thm-extremal'), extremal));
test('thm-local — the retreat is a weak local minimum of the cost', () => each(sample('yes', 'thm-local'), retreat));
test('prop-additive — on a product, both costs are the sums of the factors', () => each(sample('yes', 'prop-additive'), additive));
