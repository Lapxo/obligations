import { point } from '@lapxo/obligations';
import type { Point } from '@lapxo/obligations';
import { disagree } from '@lapxo/obligations/encounter';
import { amplitude, coherence, fringes, interfere, phase, seenAs } from '@lapxo/obligations/views/field';
import type { Claim } from '@lapxo/obligations/views/field';
import { curvature, distance, entangled, grow, horizon, neighbours, reach, resting, tunnel } from '@lapxo/obligations/views/product';
const verdictOf = (place: { readonly seen: readonly { readonly origin: string }[] }): string => {
  const one = new Set(place.seen.map((s) => s.origin)).size < 2;
  return one ? 'grey' : disagree(place as never) ? 'split' : 'agreed';
};
import { sample } from './vectors-harness.ts';
import type { Vector } from './vectors-harness.ts';

type Seen = { readonly origin: string; readonly span: { readonly lo: number; readonly hi: number } };
const BAND = { lo: 0, hi: 100 };
const SPAN = { lo: 0, hi: 1 };
const draw = (seed: number): (() => number) => {
  let held = seed;
  return () => { held = (held * 1103515245 + 12345) % 2147483648; return held / 2147483648; };
};
const one = (v: Vector): Vector => (v.cases as Vector[])[0]!;

function attach(pull: number, seed: number, cells: number, epochs: number, each: number): { ratios: number[]; held: number[]; world: Point[] } {
  const next = draw(seed);
  const held = Array.from({ length: cells }, () => 0);
  const seen: Seen[][] = Array.from({ length: cells }, () => []);
  const ratios: number[] = [];
  let placed = 0;
  for (let epoch = 1; epoch <= epochs; epoch += 1) {
    for (let k = 0; k < each; k += 1) {
      const weight = held.map((n) => 1 + pull * n);
      const total = weight.reduce((s, w) => s + w, 0);
      let pick = next() * total;
      let i = 0;
      while (pick > weight[i]! && i < cells - 1) { pick -= weight[i]!; i += 1; }
      held[i] += 1;
      seen[i]!.push({ origin: `o${placed}`, span: BAND });
      placed += 1;
    }
    ratios.push(Number(curvature(seen.map((s, i) => point(`c${i}`, epoch, s))).toFixed(1)));
  }
  return { ratios, held, world: seen.map((s, i) => point(`c${i}`, epochs, s)) };
}

function cities(a: number, desert: number, b: number): Point[] {
  const seen: Seen[][] = Array.from({ length: a + desert + b }, () => []);
  const chainOver = (from: number, to: number, name: string): void => {
    for (let i = from; i < to; i += 1) { seen[i]!.push({ origin: `${name}${i}`, span: BAND }); seen[i + 1]!.push({ origin: `${name}${i}`, span: BAND }); }
  };
  chainOver(0, a - 1, 'a');
  for (let i = a; i < a + desert; i += 1) seen[i]!.push({ origin: `d${i}`, span: BAND });
  chainOver(a + desert, a + desert + b - 1, 'b');
  return seen.map((s, i) => point(`c${i}`, 0, s));
}

const withOne = (world: readonly Point[], at: readonly number[], name: string): Point[] =>
  world.map((cell, i) => (at.includes(i) ? point(cell.at[0]!, 1, [...cell.seen, { origin: name, span: BAND }]) : cell));

function pairs(world: readonly Point[]): number {
  const graph = neighbours(world);
  const seen = new Set<string>();
  let sum = 0;
  for (const cell of world) {
    const at = cell.at.join('/');
    if (seen.has(at)) continue;
    const edge = [at];
    seen.add(at);
    let n = 0;
    while (edge.length) { const x = edge.pop()!; n += 1; for (const y of graph.get(x) ?? []) if (!seen.has(y)) { seen.add(y); edge.push(y); } }
    sum += (n * (n - 1)) / 2;
  }
  return sum;
}

function restingWorld(seed: number, sizes: readonly number[], lowest: number, share: number): { world: Point[]; floors: number[] } {
  const next = draw(seed);
  const size = sizes.reduce((s, n) => s + n, 0);
  const seen: Seen[][] = Array.from({ length: size }, () => []);
  let from = 0;
  for (const [c, n] of sizes.entries()) {
    for (let i = from; i < from + n - 1; i += 1) { seen[i]!.push({ origin: `w${c}-${i}`, span: BAND }); seen[i + 1]!.push({ origin: `w${c}-${i}`, span: BAND }); }
    from += n;
  }
  const floors: number[] = [];
  for (let i = 0; i < size; i += 1) {
    const lo = lowest + Math.floor(next() * (100 - lowest));
    floors.push(lo);
    seen[i]!.push({ origin: `own${i}`, span: { lo, hi: 100 } });
    if (next() < share) seen[i]!.push({ origin: 'ceiling', span: BAND });
  }
  return { world: seen.map((s, i) => point(`c${i}`, 0, s)), floors };
}

const bar = (xs: readonly number[]): string => {
  const top = Math.max(...xs);
  return xs.map((x) => (x > top / 2 ? '#' : '.')).join('');
};
const alternating = (n: number, period: number): Claim[] =>
  Array.from({ length: n }, (_, i) => ({ origin: `o${i}`, epoch: i % 2 === 0 ? 0 : period / 2, span: SPAN }));
const sweep = (claims: readonly Claim[], period: number): readonly number[] => fringes(claims, period, [...Array(period).keys()]);
const together = (n: number): Claim[] => Array.from({ length: n }, (_, i) => ({ origin: `o${i}`, epoch: 8, span: SPAN }));
const strewn = (n: number, seed: number): Claim[] => {
  const pick = draw(seed);
  return Array.from({ length: n }, (_, i) => ({ origin: `o${i}`, epoch: Math.floor(pick() * 8), span: SPAN }));
};

test('H2-density-attracts — origins that land where origins are make a ratio that rises at every epoch; the same budget placed blind does not', () => {
  const c = one(sample('yes', 'H2-density-attracts'));
  const pulled = attach(c['pull'] as number, c['seed'] as number, c['cells'] as number, c['epochs'] as number, c['each'] as number);
  compare(pulled.ratios, c['ratios'], 'the ratio at each epoch');
  compare(Boolean(pulled.ratios.every((r, i) => i === 0 || r > pulled.ratios[i - 1]!)), true, 'the ratio rises at every epoch');
  compare(pulled.held.filter((n) => n > 0).length, c['cities'], 'cells touched');
  compare(pulled.held.filter((n) => n === 0).length, c['deserts'], 'cells left empty');
  compare(Math.max(...pulled.held), c['densest'], 'the densest cell');
  const blind = c['blind'] as Vector;
  const flat = attach(blind['pull'] as number, c['seed'] as number, c['cells'] as number, c['epochs'] as number, c['each'] as number);
  compare(flat.ratios, blind['ratios'], 'the blind ratio at each epoch');
  compare(Math.max(...flat.ratios) * 8 < Math.max(...pulled.ratios), true, 'blind placement stays flat where attachment climbs');
  compare(flat.held.filter((n) => n > 0).length, blind['cities'], 'blind placement touches more cells');
  compare(sample('no', 'H2-density-attracts').cases[0]['expected.ok'], false);
});

test('T39-cells-grow-until-stopped — a cell grows to the wall or the midpoint, and an origin landing beside it never widens anything', () => {
  const c = one(sample('yes', 'T39-cells-grow-until-stopped'));
  const walls = c['walls'] as number[];
  const got = grow(walls, c['placed'] as number[]);
  compare(got.map((g) => g.width), c['widths'], 'the width of each cell');
  const beside = c['beside'] as Vector;
  const after = grow(walls, beside['placed'] as number[]);
  compare(after.map((g) => g.width), beside['widths'], 'the widths once one more origin lands');
  for (const g of got) {
    const lo = Math.max(...walls.filter((w) => w <= g.at));
    const hi = Math.min(...walls.filter((w) => w >= g.at));
    compare(g.width <= hi - lo, true, 'no cell grows past a wall');
    const now = after.find((h) => h.at === g.at);
    compare(now !== undefined && now.width <= g.width, true, 'no cell widens when an origin lands beside it');
  }
});

test('T40-cost-by-density — one budget of origins, two placements, and a ratio that is a fact about placement', () => {
  const c = one(sample('yes', 'T40-cost-by-density'));
  const pulled = c['attached'] as Vector;
  const flat = c['blind'] as Vector;
  const dense = attach(pulled['pull'] as number, c['seed'] as number, c['cells'] as number, c['epochs'] as number, c['each'] as number);
  const spread = attach(flat['pull'] as number, c['seed'] as number, c['cells'] as number, c['epochs'] as number, c['each'] as number);
  compare(dense.ratios.at(-1), pulled['ratio'], 'the ratio where reading attracts reading');
  compare(spread.ratios.at(-1), flat['ratio'], 'the ratio where it does not');
  compare(dense.held.filter((n) => n > 0).length, pulled['cities'], 'cities');
  compare(dense.held.filter((n) => n === 0).length, pulled['deserts'], 'deserts');
  compare(spread.held.filter((n) => n > 0).length, flat['cities'], 'cells the blind budget touches');
  const placed = dense.held.reduce((n, held) => n + held, 0);
  compare(dense.world.reduce((n, cell) => n + cell.seen.length, 0), placed, 'no cell carries an origin nobody placed in it');
});

test('T41-distance-is-the-walk-between-lookings — distance is the walk of shared lookings: a metric inside a city, no number across a desert', () => {
  const c = one(sample('yes', 'T41-distance-is-the-walk-between-lookings'));
  const two = cities(c['city'] as number, c['desert'] as number, c['other'] as number);
  const from = c['from'] as string;
  const to = c['to'] as string;
  compare(distance(two, from, to), two.length, 'the two cities are not at a distance: the walk reads the top of the form');
  compare(horizon(two, from).length, c['horizon'], 'what a cell of the first city cannot reach');
  compare(reach(two, from), c['reach'], 'what it can');
  compare(tunnel(two, [from, to]).length, c['crosses'], 'the pair one claim at both sides would cross');
  const crossed = withOne(two, [0, (c['city'] as number) + (c['desert'] as number) + (c['other'] as number) - 1], 'coarse');
  const after = c['after'] as Vector;
  compare(distance(crossed, from, to), after['distance'], 'the distance one coarse claim leaves');
  compare(horizon(crossed, from).length, after['horizon'], 'the horizon it collapses');
  const next = draw(1);
  const far = Array.from({ length: 200 }, () => distance(crossed, `c${Math.floor(next() * 160)}`, `c${320 + Math.floor(next() * 80)}`));
  const near = Array.from({ length: 200 }, () => distance(two, `c${Math.floor(next() * 160)}`, `c${Math.floor(next() * 160)}`));
  compare(Number((far.reduce((s, d) => s + d, 0) / far.length).toFixed(1)), c['meanFar'], 'the mean distance between the cities');
  compare(Number((near.reduce((s, d) => s + d, 0) / near.length).toFixed(1)), c['meanNear'], 'the mean distance inside one');
  const names = two.map((cell) => cell.at.join('/'));
  const triples = Array.from({ length: c['triples'] as number }, () => [names[Math.floor(next() * 400)]!, names[Math.floor(next() * 400)]!, names[Math.floor(next() * 400)]!] as const);
  compare(triples.filter(([x, y, z]) => distance(crossed, x, z) > distance(crossed, x, y) + distance(crossed, y, z)).length, c['broken'], 'a third cell never shortens the walk');
  compare(triples.filter(([x, y]) => distance(crossed, x, y) !== distance(crossed, y, x)).length, c['asymmetric'], 'the walk is the same both ways');
  compare(distance(crossed, from, from), 0, 'a cell is at no distance from itself');
  const walk = neighbours(two);
  compare(names.filter((at) => distance(two, from, at) === 1 && !(walk.get(from) ?? []).includes(at)).length, 0, 'nothing is one step away with no shared looking');
});

test('T42-no-privileged-observer — two observers differ where their horizons differ, and never where they hold the same origins', () => {
  const c = one(sample('yes', 'T42-no-privileged-observer'));
  const pick = draw(c['seed'] as number);
  const seen: Seen[][] = Array.from({ length: c['cells'] as number }, () => []);
  for (let i = 0; i < (c['cells'] as number); i += 1) {
    seen[i]!.push({ origin: `core${i}`, span: { lo: 0, hi: 60 } });
    if (pick() < (c['share'] as number)) seen[i]!.push({ origin: `mine${i}`, span: { lo: 50 + Math.floor(pick() * 50), hi: 100 } });
    if (pick() < (c['share'] as number)) seen[i]!.push({ origin: `yours${i}`, span: { lo: 50 + Math.floor(pick() * 50), hi: 100 } });
  }
  const world = seen.map((s, i) => point(`c${i}`, 0, s));
  const mine = world.map((cell) => point(cell.at[0]!, 0, cell.seen.filter((s) => !s.origin.startsWith('yours'))));
  const yours = world.map((cell) => point(cell.at[0]!, 0, cell.seen.filter((s) => !s.origin.startsWith('mine'))));
  const same = world.map((_, i) => JSON.stringify(mine[i]!.seen) === JSON.stringify(yours[i]!.seen));
  compare(world.filter((_, i) => verdictOf(mine[i]!) !== verdictOf(yours[i]!)).length, c['differ'], 'the cells two observers read differently');
  compare(same.filter(Boolean).length, c['sameOrigins'], 'the cells they hold the same origins at');
  compare(world.filter((_, i) => same[i] === true && verdictOf(mine[i]!) !== verdictOf(yours[i]!)).length, c['disagreeingWhereSame'], 'where they hold the same origins they agree');
});

test('T43-each-origin-gives-one-fact-and-one-distance — no origin, no fact and no distance; each origin gives one of each', () => {
  const c = one(sample('yes', 'T43-each-origin-gives-one-fact-and-one-distance'));
  const got = (c['scan'] as Vector[]).map((row, k) => {
    const world = cities(160, 160, 80).map((cell, i) => (i < [0, 1, 2, 4, 8, 16][k]! ? cell : point(cell.at[0]!, 0, [])));
    return {
      origins: world.reduce((n, cell) => n + cell.seen.length, 0),
      facts: world.filter((cell) => verdictOf(cell) === 'agreed').length,
      finite: world.filter((cell) => distance(world, 'c0', cell.at.join('/')) < world.length).length - 1,
    };
  });
  compare(got, c['scan'], 'origins, facts and finite distances at each step of the scan');
  compare(got[0]!.facts === 0 && got[0]!.finite === 0, true, 'with no origin there is neither information nor a metric');
  compare(Boolean(got.every((row) => (row.facts > 0) === (row.finite > 0))), true, 'neither appears without the other');
});

test('T44-an-origin-is-worth-its-reach — one claim of one width, four placements, four prices', () => {
  const c = one(sample('yes', 'T44-an-origin-is-worth-its-reach'));
  const two = cities(c['city'] as number, c['desert'] as number, c['other'] as number);
  const was = pairs(two);
  for (const p of c['placements'] as Vector[]) {
    const at = p['at'] as number[];
    compare(pairs(withOne(two, at, 'one')) - was, p['opened'], `${p['name']}: the pairs it opens`);
    compare(tunnel(two, at.map((i) => `c${i}`)).length, p['crosses'], `${p['name']}: what it crosses`);
  }
  const inside = (c['placements'] as Vector[])[0]!;
  const across = (c['placements'] as Vector[])[3]!;
  compare((across['opened'] as number) > (inside['opened'] as number), true, 'the same claim is worth more where the looking is not');
});

test('T45-cells-that-rest-on-one-bound-are-entangled — narrowing one ceiling turns cells red with nobody looking, the same cells by either order', () => {
  const c = one(sample('yes', 'T45-cells-that-rest-on-one-bound-are-entangled'));
  const held = restingWorld(c['seed'] as number, c['sizes'] as number[], c['lowest'] as number, c['share'] as number);
  const bound = c['bound'] as string;
  const was = { lo: (c['was'] as number[])[0]!, hi: (c['was'] as number[])[1]! };
  const now = { lo: (c['now'] as number[])[0]!, hi: (c['now'] as number[])[1]! };
  const changed = resting(held.world, bound, was, now);
  compare(entangled(held.world, bound).length, c['rest'], 'the cells that rest on it');
  compare(changed.length, c['changed'], 'the cells it turns');
  const past = new Set(horizon(held.world, 'c0', [bound]));
  compare(changed.filter((at) => past.has(at)).length, c['past'], 'the turned cells nobody at c0 can reach');
  const steps = c['steps'] as number[][];
  const middle = { lo: steps[0]![0]!, hi: steps[0]![1]! };
  const stepped = new Set([...resting(held.world, bound, was, middle), ...resting(held.world, bound, middle, now)]);
  compare(stepped.size === changed.length && changed.every((at) => stepped.has(at)), true, 'two steps name the same cells as one');
  compare(entangled(held.world, bound).filter((at) => held.floors[Number(at.slice(1))]! > now.hi && !changed.includes(at)).length, c['restingAndUnmoved'], 'no resting cell above the new ceiling stays green');
  compare(changed.filter((at) => !entangled(held.world, bound).includes(at)).length, c['changedNotResting'], 'nothing that does not rest on it moves');
});

test('T46-a-bound-moves-cells-no-walk-reaches — looking stops at the horizon and a bound does not, which is what tells the two apart', () => {
  const c = one(sample('yes', 'T46-a-bound-moves-cells-no-walk-reaches'));
  const held = restingWorld(c['seed'] as number, c['sizes'] as number[], c['lowest'] as number, c['share'] as number);
  const bound = c['bound'] as string;
  const changed = resting(held.world, bound, BAND, { lo: 0, hi: 60 });
  const past = new Set(horizon(held.world, 'c0', [bound]));
  compare(reach(held.world, 'c0', [bound]), c['reach'], 'what looking reaches');
  compare(changed.length, c['changed'], 'what one signature changes');
  compare(changed.filter((at) => past.has(at)).length, c['past'], 'and how much of that is past the horizon');
  compare(reach(held.world, 'c0'), c['asIfLooking'], 'counted as a looking the bound would make the world one neighbourhood');
  compare((c['past'] as number) > 0, true, 'a signature arrives where a looking cannot');
  compare(horizon(held.world, 'c0', [bound]).filter((at) => distance(held.world, 'c0', at, [bound]) < held.world.length).length, 0, 'nothing past the horizon is at a distance');
});

test('T48-epoch-is-phase — the delay sweep draws the period, and observing one route moves the pattern to its complement', () => {
  const c = one(sample('yes', 'T48-epoch-is-phase'));
  for (const p of c['periods'] as Vector[]) {
    const period = p['period'] as number;
    const claims = alternating(c['claims'] as number, period);
    const free = sweep(claims, period);
    compare(bar(free), p['pattern'], `period ${period}: the fringe`);
    compare(Math.max(...free), p['high'], `period ${period}: what in-phase claims make`);
    compare(Math.min(...free) < 1e-9, true, `period ${period}: half a period apart they cancel`);
    const observed = sweep(claims.map((claim, i) => (i % 2 === 0 ? claim : { ...claim, epoch: 0 })), period);
    compare(bar(observed), p['observed'], `period ${period}: the fringe once one route is observed`);
    compare(bar(observed) !== bar(free), true, `period ${period}: observing a route moves the pattern`);
    compare(phase({ origin: 'o', epoch: period, span: SPAN }, period), 0, `period ${period}: a whole period is no turn at all`);
  }
});

test('T49-amplitude-has-sign-and-phase — in phase they go as the square of their number, strewn as its order, and a withdrawal cancels its write', () => {
  const c = one(sample('yes', 'T49-amplitude-has-sign-and-phase'));
  const n = c['n'] as number;
  const period = c['period'] as number;
  compare(interfere(together(n), period), c['inPhase'], 'what claims at one turn of the period make');
  compare(Number(coherence(together(n), period).toFixed(2)), c['coherenceInPhase'], 'and their coherence');
  const runs = Array.from({ length: c['draws'] as number }, (_, r) => interfere(strewn(n, 100 + r), period));
  const cohs = Array.from({ length: c['draws'] as number }, (_, r) => coherence(strewn(n, 100 + r), period));
  compare(Number((runs.reduce((a, b) => a + b, 0) / runs.length).toFixed(1)), c['meanStrewn'], 'what the same claims strewn make');
  compare(Number((cohs.reduce((a, b) => a + b, 0) / cohs.length).toFixed(2)), c['meanCoherenceStrewn'], 'and their coherence');
  compare((c['inPhase'] as number) > (c['meanStrewn'] as number) * n * 0.5, true, 'in phase is of the order of the square, strewn of the order of the number');
  const claim: Claim = { origin: 'o', epoch: 3, span: SPAN };
  compare(amplitude(claim), c['amplitude'], 'how much a claim narrows');
  compare(amplitude({ ...claim, withdraws: true }), c['withdrawal'], 'and a withdrawal of it, the other way');
  compare(Number(interfere([claim, { ...claim, withdraws: true }], period).toFixed(3)), c['writeAndWithdrawal'], 'a write and its withdrawal at one epoch leave nothing');
  compare(Number(interfere([claim, { ...claim, epoch: 5, withdraws: true }], period).toFixed(3)), c['apart'], 'at different epochs they do not cancel');
  compare(seenAs(point('c', 3, [{ origin: 'o', span: SPAN }]), period).length, 1, 'a cell is read as the claims that landed on it');
});

test('H3-a-distant-signature-moves-a-cell-that-did-not-move — the same cell, the same record, and the verdict comes out both ways', () => {
  const c = one(sample('yes', 'H3-a-distant-signature-moves-a-cell-that-did-not-move'));
  const value = c['value'] as number;
  const seeing = draw(c['seed'] as number);
  const was = point('x', 0, [{ origin: 'own', span: { lo: value, hi: value } }, { origin: 'far', span: BAND }]);
  const before = new Set<string>();
  let moved = 0;
  for (let trial = 0; trial < (c['trials'] as number); trial += 1) {
    before.add(JSON.stringify(was.seen));
    const k = Math.floor(seeing() * (c['span'] as number));
    if (verdictOf(point('x', 1, [{ origin: 'own', span: { lo: value, hi: value } }, { origin: 'far', span: { lo: 0, hi: k } }])) !== verdictOf(was)) moved += 1;
  }
  compare(moved, c['changed'], 'the trials a distant signature changed');
  compare(before.size, c['states'], 'the cell held one state in every trial');
  compare(moved > 0 && moved < (c['trials'] as number), true, 'and the verdict came out both ways');
  compare(sample('no', 'H3-a-distant-signature-moves-a-cell-that-did-not-move').cases[0]['expected.ok'], false);
});
