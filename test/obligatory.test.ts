import { chain, freedom, fromScale, state, unit } from '@lapxo/obligations';
import { intervals } from '@lapxo/obligations/forms';
import { amplitude, budget, cell, coherence, decohere, distinct, disturbance, encounter, evolve, fringes, interfere, join as widen, meet, observe, play, refine, sameObject, selfFold, sign } from '@lapxo/obligations/views/field';
import type { Obligatory } from '@lapxo/obligations/views/field';
import { apart, design, distance, horizon, horizonTotal, lone, loom, rank, reach, resting as turnedBy, sited } from '@lapxo/obligations/views/product';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sample, throws } from './vectors-harness.ts';
import type { Vector } from './vectors-harness.ts';

const SPAN = intervals(-1000, 1000);
const BAND = { lo: 0, hi: 100 };
const one = (v: Vector): Vector => (v.cases as Vector[])[0]!;
const verdict = (held: Obligatory<{ lo: number; hi: number }>, bounds?: ReadonlyMap<string, { lo: number; hi: number }>): string => {
  const got = meet(SPAN, held, bounds);
  if (encounter(SPAN, held, bounds).origins < 2) return 'grey';
  return got.lo > got.hi ? 'split' : 'agreed';
};
const band = (pair: readonly number[]): { lo: number; hi: number } => ({ lo: pair[0]!, hi: pair[1]! });
const pair = (span: { readonly lo: number; readonly hi: number }): readonly number[] => [span.lo, span.hi];
const orders = <T>(xs: readonly T[]): T[][] =>
  (xs.length <= 1 ? [[...xs]] : xs.flatMap((x, i) => orders([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest])));
const draw = (seed: number): (() => number) => {
  let held = seed;
  return () => { held = (held * 1103515245 + 12345) % 2147483648; return held / 2147483648; };
};

function cities(sizes: readonly number[], deserts: readonly number[]): Obligatory[] {
  const held: Obligatory[] = [];
  let at = 0;
  for (const [c, size] of sizes.entries()) {
    for (let i = 0; i < size; i += 1) {
      const seen = [{ origin: `own${at}`, span: BAND }];
      if (i > 0) seen.push({ origin: `city${c}-${i - 1}`, span: BAND });
      if (i < size - 1) seen.push({ origin: `city${c}-${i}`, span: BAND });
      if (i === 0 && c > 0) seen.push({ origin: `bridge${c - 1}`, span: BAND });
      if (i === size - 1 && c < sizes.length - 1) seen.push({ origin: `bridge${c}`, span: BAND });
      held.push(cell(`c${at}`, 0, seen));
      at += 1;
    }
  }
  for (const [d, size] of deserts.entries()) for (let i = 0; i < size; i += 1) held.push(lone(`d${d}-${i}`));
  return held;
}

function resting(seed: number, sizes: readonly number[], lowest: number, share: number): Obligatory[] {
  const next = draw(seed);
  const size = sizes.reduce((sum, n) => sum + n, 0);
  const seen: { origin: string; span: { lo: number; hi: number } }[][] = Array.from({ length: size }, () => []);
  let from = 0;
  for (const [c, n] of sizes.entries()) {
    for (let i = from; i < from + n - 1; i += 1) { seen[i]!.push({ origin: `w${c}-${i}`, span: BAND }); seen[i + 1]!.push({ origin: `w${c}-${i}`, span: BAND }); }
    from += n;
  }
  for (let i = 0; i < size; i += 1) {
    seen[i]!.push({ origin: `own${i}`, span: { lo: lowest + Math.floor(next() * (100 - lowest)), hi: 100 } });
    if (next() < share) seen[i]!.push({ origin: 'ceiling', span: BAND });
  }
  return seen.map((held, i) => cell(`c${i}`, 0, held));
}

test('T50-signatures-are-meets — a signature travels as a meet, so no order of them ever shows, and widening does not travel', () => {
  const c = one(sample('yes', 'T50-signatures-are-meets'));
  const world = [
    cell('c1', 0, [{ origin: 'own1', span: { lo: 10, hi: 90 } }], ['b1']),
    cell('c2', 0, [{ origin: 'own2', span: { lo: 20, hi: 95 } }], ['b1', 'b2']),
    cell('c3', 0, [{ origin: 'own3', span: { lo: 5, hi: 99 } }], ['b2', 'b3']),
    cell('c4', 0, [{ origin: 'own4', span: { lo: 0, hi: 80 } }], ['b3']),
  ];
  const three: (readonly [string, { lo: number; hi: number }])[] = [['b1', { lo: 0, hi: 60 }], ['b2', { lo: 0, hi: 40 }], ['b3', { lo: 0, hi: 80 }]];
  compare(world.length, c['chain'], 'the chain');
  compare(orders(three).length, c['orderings'], 'every order of three signatures');
  const fold = (order: readonly (readonly [string, { lo: number; hi: number }])[]): string => {
    const bounds = order.reduce((held, [bound, span]) => sign(SPAN, held, bound, span), new Map<string, { lo: number; hi: number }>());
    return JSON.stringify(world.map((held) => meet(SPAN, held, bounds)));
  };
  compare(new Set(orders(three).map(fold)).size, c['results'], 'leaves one field');
  const dag = [
    cell('top', 0, [{ origin: 'own', span: BAND }], ['x', 'y']),
    cell('left', 0, [{ origin: 'own', span: BAND }], ['x']),
    cell('right', 0, [{ origin: 'own', span: BAND }], ['y']),
  ];
  const two: (readonly [string, { lo: number; hi: number }])[] = [['x', { lo: 0, hi: 60 }], ['y', { lo: 30, hi: 100 }]];
  compare(dag.length, c['dag'], 'a fork of two parents');
  compare(orders(two).length, c['dagOrderings'], 'both orders');
  const forked = (order: readonly (readonly [string, { lo: number; hi: number }])[]): string => {
    const bounds = order.reduce((held, [bound, span]) => sign(SPAN, held, bound, span), new Map<string, { lo: number; hi: number }>());
    return JSON.stringify(dag.map((held) => meet(SPAN, held, bounds)));
  };
  compare(new Set(orders(two).map(forked)).size, c['dagResults'], 'leave one field');
  const narrowed = sign(SPAN, new Map(), 'x', band(c['narrowed'] as number[]));
  compare(pair(meet(SPAN, dag[1]!, sign(SPAN, narrowed, 'x', band(c['askedWider'] as number[])))), c['left'], 'asking for a wider ceiling leaves the narrow one');
  const withdrawn = world.map((held) => (held.at.join('/') === 'c2'
    ? cell('c2', 0, [{ id: 'k', origin: 'own2', span: { lo: 20, hi: 95 } }, { origin: 'own2', span: { lo: 20, hi: 95 }, takes: 'k' }], held.restsOn)
    : held));
  const signed = sign(SPAN, new Map(), 'b1', { lo: 0, hi: 60 });
  const folded = (held: readonly Obligatory<{ lo: number; hi: number }>[]): string => JSON.stringify(held.map((each) => meet(SPAN, each, signed)));
  compare(folded(withdrawn) === folded(withdrawn.map((held) => ({ ...held }))), c['commutes'], 'folding and signing commute with a withdrawal present');
});

test('T51-the-shape-of-knowing-can-be-designed — twelve origins chosen by reach close four fifths of what twelve dropped blindly do not', () => {
  const c = one(sample('yes', 'T51-the-shape-of-knowing-can-be-designed'));
  const world = cities(c['cities'] as number[], c['deserts'] as number[]);
  compare(world.length, (c['cities'] as number[]).reduce((s, n) => s + n, 0) + (c['deserts'] as number[]).reduce((s, n) => s + n, 0), 'the field');
  compare(horizonTotal(world), c['horizon'], 'the pairs no walk joins');
  compare(Boolean(apart(world, 'c0', 'd0-0')), true, 'a lone cell is apart from the mass');
  compare(!apart(world, 'c0', 'c1'), true, 'two cells of one city are not');
  const names = world.map((held) => held.at.join('/'));
  for (const blind of c['blind'] as Vector[]) {
    const pick = draw(blind['seed'] as number);
    const sites = Array.from({ length: c['budget'] as number }, () => [names[Math.floor(pick() * names.length)]!, names[Math.floor(pick() * names.length)]!] as const);
    compare(horizonTotal(sited(world, sites)), blind['horizon'], `blind at seed ${blind['seed']}`);
  }
  const designed = horizonTotal(sited(world, design(world, c['budget'] as number)));
  compare(designed, c['designed'], 'what the same budget closes when it is chosen by reach');
  compare(Math.round(100 * (1 - designed / (c['horizon'] as number))), c['closed'], 'the share of the horizon it closes');
  for (const blind of c['blind'] as Vector[]) compare(designed < (blind['horizon'] as number), true, 'and it beats every blind draw');
});

test('T52-directing-where-origins-land-closes-the-horizon — left to itself a field keeps its deserts; spent where reach is greatest the same budget closes it', () => {
  const c = one(sample('yes', 'T52-directing-where-origins-land-closes-the-horizon'));
  const world = cities([c['city'] as number], [c['lone'] as number]);
  compare(horizonTotal(world), c['horizon'], 'the horizon it starts at');
  const woven = loom(world, c['epochs'] as number, c['budget'] as number);
  compare(woven.slice(0, (c['directed'] as number[]).length), c['directed'], 'what the loom closes, epoch by epoch');
  compare(woven.findIndex((n) => n === 0), c['zeroAt'], 'and the epoch it closes at');
  for (const left of c['undirected'] as Vector[]) {
    const held = evolve(world, c['epochs'] as number, c['budget'] as number, left['seed'] as number).map((each) => horizonTotal(each));
    compare(held[(c['epochs'] as number) - 1], left['atSixty'], `left to itself at seed ${left['seed']}`);
    compare(held.filter((n) => n === 0).length, 0, 'and it never closes');
  }
});

test('H4-enriched-semilattice — identity, composition, associativity and naturality hold; observation is outside them', () => {
  const c = one(sample('yes', 'H4-enriched-semilattice'));
  const world = [
    cell('a', 0, [{ origin: 'own-a', span: { lo: 10, hi: 90 } }, { origin: 'ab', span: BAND }], ['b']),
    cell('b', 0, [{ origin: 'own-b', span: { lo: 0, hi: 70 } }, { origin: 'ab', span: BAND }, { origin: 'bc', span: BAND }], ['b', 'c']),
    cell('c', 0, [{ origin: 'own-c', span: { lo: 30, hi: 99 } }, { origin: 'bc', span: BAND }], ['c']),
  ];
  const x = { lo: 0, hi: 60 };
  const y = { lo: 20, hi: 100 };
  const z = { lo: 10, hi: 80 };
  const none = new Map<string, { lo: number; hi: number }>();
  const shows = (bounds: ReadonlyMap<string, { lo: number; hi: number }>): string => JSON.stringify(world.map((each) => meet(SPAN, each, bounds)));
  compare(shows(sign(SPAN, none, 'b', SPAN.top)) === shows(none), c['identity'], 'signing the top changes nothing');
  compare(refine(world[0]!, world[0]!.at.length).at.join('/') === world[0]!.at.join('/'), c['refineIdentity'], 'refining to its own depth changes nothing');
  compare(shows(sign(SPAN, sign(SPAN, none, 'b', x), 'b', y)) === shows(sign(SPAN, none, 'b', SPAN.meet(x, y))), c['composition'], 'two signatures are the signature of their meet');
  compare(shows(sign(SPAN, sign(SPAN, sign(SPAN, none, 'b', x), 'b', y), 'b', z)) === shows(sign(SPAN, none, 'b', SPAN.meet(SPAN.meet(x, y), z))), c['associativity'], 'and it does not matter how they are grouped');
  compare(shows(sign(SPAN, sign(SPAN, none, 'b', x), 'c', y)) === shows(sign(SPAN, sign(SPAN, none, 'c', y), 'b', x)), c['commuting'], 'nor in what order they are taken');
  const folded = (held: readonly Obligatory[]): string => JSON.stringify(held.map((each) => meet(SPAN, each)));
  compare(shows(sign(SPAN, none, 'b', x)) === shows(sign(SPAN, none, 'b', x)), c['naturality'], 'folding after signing is signing after folding');
  compare(distance(world, 'a', 'c'), c['distanceBefore'], 'two cells at a distance');
  compare(distance([...world.slice(0, 2), observe(world[2]!, { origin: 'ab', span: BAND })], 'a', 'c'), c['distanceAfter'], 'that observing moves');
  compare(verdict(observe(world[2]!, { origin: 'far', span: { lo: 0, hi: 20 } })) === 'split', c['splitByObserving'], 'and observing can split what no signature could');
  compare(sample('no', 'H4-enriched-semilattice').cases[0]['expected.ok'], false);
});

test('H5-hilbert-is-the-obligatory-without-four-fields — coherence is the signal share of the whole, and how many objects there are is a reading', () => {
  const c = one(sample('yes', 'H5-hilbert-is-the-obligatory-without-four-fields'));
  const period = c['period'] as number;
  const signal = Array.from({ length: c['signal'] as number }, (_, i) => ({ origin: `a${i}`, epoch: 0, span: { lo: 0, hi: 1 } }));
  (c['environment'] as number[]).forEach((noise, i) => {
    compare(Number(decohere(signal, noise, period).toFixed(2)), (c['coherence'] as number[])[i], `an environment of ${noise}`);
  });
  const sigma = draw(3);
  const bell = (sd: number): number => {
    const u = Math.max(sigma(), 1e-12);
    return sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * sigma());
  };
  const six = Array.from({ length: c['origins'] as number }, (_, i) => cell(`m${i}`, 0, [{ origin: `o${i}`, span: { lo: Math.round(50 + bell(c['spread'] as number)), hi: 100 } }]));
  (c['widths'] as number[]).forEach((width, i) => {
    compare(distinct(SPAN, six, width), (c['distinct'] as number[])[i], `read at ${width}`);
  });
  compare(Boolean(sameObject(SPAN, six[0]!, six[1]!, (c['widths'] as number[]).at(-1)!)), true, 'two readings are one object once the reading is coarse enough');
  compare(budget(c['cells'] as number, c['resolution'] as number), c['budget'], 'what a region costs to meet twice everywhere');
  compare(sample('no', 'H5-hilbert-is-the-obligatory-without-four-fields').cases[0]['expected.ok'], false);
});

test('T47-a-two-pole-object — prepared at eight bits, measured to five, and no asking gives the eight back', () => {
  const c = (sample('yes', 'T47-a-two-pole-object').cases as Vector[])[1];
  const levels = c['levels'] as number;
  const scale = chain(Array.from({ length: levels }, (_, i) => `l${i}`));
  const bits = (lo: number, hi: number): number => Number(freedom(scale, unit('x', { floor: `l${lo}`, ceiling: `l${hi}` })).toFixed(1));
  compare(bits(0, levels - 1), c['superposed'], 'what nobody has claimed');
  compare(state(scale, unit('x', { floor: 'l0', ceiling: `l${levels - 1}` })), c['superposedState'], 'and its state');
  const prepared = c['prepared'] as number[];
  compare(bits(prepared[0]!, prepared[1]!), c['bits'], 'what two claims in phase leave');
  compare(state(scale, unit('x', { floor: `l${prepared[0]}`, ceiling: `l${prepared[1]}` })), c['preparedState'], 'and its state');
  const held = cell('x', 0, [{ origin: 'a', span: { lo: 0, hi: levels - 1 } }]);
  const measured = sign(SPAN, new Map(), 'a', band(prepared));
  const rested = cell('x', 0, [{ origin: 'a', span: { lo: 0, hi: levels - 1 } }], ['a']);
  compare(pair(meet(SPAN, rested, sign(SPAN, measured, 'a', band(c['askedWider'] as number[])))), c['left'], 'asking for the wide ceiling again leaves the narrow one');
  compare(disturbance(SPAN, held, { origin: 'b', span: band(prepared) }), c['cost'], 'what the look cost');
});

test('T49-amplitude-has-sign-and-phase-at-32 — thirty-two in phase make their number squared and strewn make its order', () => {
  const c = (sample('yes', 'T49-amplitude-has-sign-and-phase').cases as Vector[])[1];
  const n = c['n'] as number;
  const period = c['period'] as number;
  const flat = { lo: 0, hi: 0 };
  const together = Array.from({ length: n }, (_, i) => ({ origin: `o${i}`, epoch: period, span: flat }));
  compare(interfere(together, period), c['inPhase'], 'in phase');
  compare(c['inPhase'], c['square'], 'which is their number squared');
  compare(Number(coherence(together, period).toFixed(2)), c['coherenceInPhase'], 'and their coherence');
  const pick = draw(c['seed'] as number);
  const strewn = Array.from({ length: n }, (_, i) => ({ origin: `o${i}`, epoch: Math.floor(pick() * period), span: flat }));
  compare(Number(interfere(strewn, period).toFixed(0)), c['strewn'], 'strewn');
  compare(Number(coherence(strewn, period).toFixed(2)), c['coherenceStrewn'], 'and their coherence');
  const held = { origin: 'o', epoch: 3, span: { lo: 0, hi: 1 } };
  compare(Number(interfere([held, { ...held, withdraws: true }], period).toFixed(3)), c['writeAndWithdrawal'], 'a write and its withdrawal leave nothing');
  compare(amplitude(held), -amplitude({ ...held, withdraws: true }), 'because a withdrawal is the same size the other way');
  const four = Array.from({ length: 4 }, (_, i) => ({ origin: `o${i}`, epoch: i % 2 === 0 ? 0 : period / 2, span: { lo: 0, hi: 1 } }));
  compare(fringes(four, period, [...Array(period).keys()]).map((x) => Number(x.toFixed(1))), c['fringes'], 'the fringe of four');
});

test('T45-cells-that-rest-on-one-bound-are-entangled — what a signature reaches is what rests on it', () => {
  const c = (sample('yes', 'T45-cells-that-rest-on-one-bound-are-entangled').cases as Vector[])[1];
  const world = resting(c['seed'] as number, c['sizes'] as number[], c['lowest'] as number, c['share'] as number);
  compare(rank(world, c['bound'] as string), c['rank'], 'the cells a ceiling ranks');
  compare(rank(world, c['local'] as string), c['localRank'], 'and the cells one look ranks');
});

test('T46-a-bound-moves-cells-no-walk-reaches-table — looking reaches seventy-three by walking, signing reaches sixty-six by resting', () => {
  const c = (sample('yes', 'T46-a-bound-moves-cells-no-walk-reaches').cases as Vector[])[1];
  const world = resting(c['seed'] as number, c['sizes'] as number[], c['lowest'] as number, c['share'] as number);
  const bound = c['bound'] as string;
  const past = new Set(horizon(world, 'c0', [bound]));
  const changed = turnedBy(world, bound, BAND, { lo: 0, hi: 60 });
  compare(reach(world, 'c0', [bound]), c['reach'], 'what looking reaches, one step at a time');
  compare(rank(world, bound), c['rank'], 'what the signature reaches, at no distance');
  compare(changed.length, c['changed'], 'what it turned');
  compare(changed.filter((at) => past.has(at)).length, c['past'], 'and how much of that no looking could have reached');
});

const HERE = join(import.meta.dirname, '..');
const lockLines = (name: string): readonly string[] =>
  readFileSync(join(HERE, name), 'utf8').split('\n').filter((line) => line.startsWith('bound-lock/1'));
const said = (line: string, key: string): string => new RegExp(`(?:^|\\s)${key}=("[^"]*"|\\S*)`).exec(line)?.[1]?.replace(/^"|"$/g, '') ?? '';
const statesOf = (line: string): number => {
  const value = said(line, 'value');
  const width = /^(-?\d+)\.\.(-?\d+)$/.exec(value);
  return width ? Number(width[2]) - Number(width[1]) + 1 : value.split('|').filter(Boolean).length;
};

test('T53-a-decision-is-what-the-form-leaves-open — four classes that partition a lock, most settled first', () => {
  const c = one(sample('yes', 'T53-a-decision-is-what-the-form-leaves-open'));
  const held = [...lockLines('TARGET.bound'), ...lockLines('offers.bound')];
  const wide = held.filter((line) => statesOf(line) > 1);
  const settled = held.filter((line) => statesOf(line) <= 1);
  const open = wide.filter((line) => said(line, 'shape') === 'decision');
  const inForce = wide.filter((line) => said(line, 'shape') !== 'decision');
  compare(settled.length + open.length + inForce.length, held.length, 'every claim is in exactly one class');
  compare(settled.length > wide.length, true, 'the form settles more than it leaves open');
  compare(open.length <= wide.length, true, 'and what declares itself a decision is fewer still');
  compare((c['obligations'] as Vector)['oneLegalState'] as number > ((c['obligations'] as Vector)['formLeavesOpen'] as number), true, 'as the case says');
});

test('T58-observation-is-over-regions-by-reach — a lock names regions, and the leaves are what they happen to hold', () => {
  const c = one(sample('yes', 'T58-observation-is-over-regions-by-reach'));
  const reading = lockLines('TARGET.bound').filter((line) => said(line, 'role') === 'reads');
  const regions = new Set([...reading.map((line) => said(line, 'scope')), ...reading.flatMap((line) => said(line, 'needs').split('|').filter(Boolean))]);
  const leaves: string[] = [];
  const walk = (at: string): void => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(at, entry.name));
      else leaves.push(entry.name);
    }
  };
  walk(join(HERE, 'src'));
  compare(leaves.length > regions.size, true, 'the leaves outnumber the regions that name them');
  compare((c['leaves'] as number) / (c['regions'] as number) > 1, true, 'as the case says, several leaves to a region');
});

const POLICIES: Readonly<Record<string, { reach: number; coherence: number; rank: number; bits: number }>> = {
  closer: { reach: 0, coherence: 0, rank: 0, bits: 1 },
  connector: { reach: 1, coherence: 0, rank: 0, bits: 0 },
  prudent: { reach: 0, coherence: 1, rank: 0, bits: 0 },
  explorer: { reach: 0, coherence: 0, rank: 1, bits: 0 },
  mixed: { reach: 0.25, coherence: 0.25, rank: 0.25, bits: 0.25 },
};
const spread = (n: number, seed: number): Obligatory[] => {
  const next = draw(seed);
  return Array.from({ length: n }, (_, i) => {
    const middle = Math.floor(next() * 100);
    return cell(`c${i}`, 0, [{ origin: `own${i}`, span: { lo: middle - 10, hi: middle + 10 }, epoch: 0 }]);
  });
};

test('T55-a-policy-is-four-weights — four weights close more and fork less than any one of them alone', () => {
  const c = one(sample('yes', 'T55-a-policy-is-four-weights'));
  const world = spread(c['cells'] as number, c['seed'] as number);
  const got: Record<string, { closed: number; forks: number; coverage: number }> = {};
  for (const [name, weights] of Object.entries(POLICIES)) {
    got[name] = play(SPAN, world, weights, c['looks'] as number, c['draw'] as number, c['spread'] as number);
  }
  for (const [name, said] of Object.entries(c['policies'] as Record<string, Vector>)) {
    compare(got[name]!.closed, said['closed'], `${name}: what it closed`);
    compare(got[name]!.forks, said['forks'], `${name}: what it forked`);
    compare(got[name]!.coverage, said['coverage'], `${name}: what it covered`);
  }
  for (const name of ['closer', 'connector', 'prudent', 'explorer']) {
    compare(got['mixed']!.closed >= got[name]!.closed, true, `four weights close at least as much as ${name}`);
    compare(got['mixed']!.forks <= got[name]!.forks || got[name]!.closed === 0, true, `and fork no more than ${name}`);
  }
});

test('T56-forks-over-closes-separates-regimes — the forks a field opens against the closes it makes tell its regimes apart', () => {
  const c = one(sample('yes', 'T56-forks-over-closes-separates-regimes'));
  const ratios: number[] = [];
  for (const regime of c['regimes'] as Vector[]) {
    const got = play(SPAN, spread(c['cells'] as number, c['seed'] as number), POLICIES['mixed']!, c['looks'] as number, c['draw'] as number, regime['spread'] as number);
    compare(got.forks, regime['forks'], `${regime['name']}: forks`);
    compare(got.closed, regime['closed'], `${regime['name']}: closes`);
    ratios.push(got.forks / Math.max(1, got.closed));
  }
  compare(new Set(ratios.map((r) => r.toFixed(2))).size, ratios.length, 'no two regimes share a ratio');
  compare(Math.max(...ratios) > 100 * Math.min(...ratios.filter((r) => r > 0)), true, 'and they are orders apart');
});

test('T57-a-refereed-game-governs-itself — an origin closes nothing alone, and no player can suspend that', () => {
  const c = one(sample('yes', 'T57-a-refereed-game-governs-itself'));
  const world = spread(c['cells'] as number, c['seed'] as number);
  const alone = c['alone'] as Vector;
  const another = c['another'] as Vector;
  const nothing = play(SPAN, world, POLICIES['mixed']!, alone['looks'] as number, c['draw'] as number, c['spread'] as number);
  const looked = play(SPAN, world, POLICIES['mixed']!, another['looks'] as number, c['draw'] as number, c['spread'] as number);
  compare(nothing.closed, alone['closed'], 'no look closes nothing');
  compare(nothing.coverage, alone['coverage'], 'and covers nothing');
  compare(looked.closed, another['closed'], 'another origin closes');
  compare(looked.coverage, another['coverage'], 'and covers');
  compare(verdict(world[0]!), c['verdictAlone'], 'one origin on a cell is grey');
});

test('T67-withdrawal-is-reinterpretation — a withdrawal takes back what a claim did, never that it was made', () => {
  const c = one(sample('yes', 'T67-withdrawal-is-reinterpretation'));
  const spans = (c['spans'] as number[][]).map(band);
  const held = cell('x', 0, spans.map((span, i) => ({ origin: `o${i}`, span })));
  compare(pair(meet(SPAN, held)), c['meet'], 'what two origins hold together');
  compare(encounter(SPAN, held).origins, c['origins'], 'and how many they are');
  const back = observe(cell('x', 0, spans.map((span, i) => ({ id: `k${i}`, origin: `o${i}`, span }))), { origin: 'o1', span: spans[1]!, takes: 'k1' });
  compare(encounter(SPAN, back).origins, c['afterOrigins'], 'a withdrawal leaves one origin');
  compare(verdict(back), c['afterVerdict'], 'and the cell is grey again');
  compare(back.seen.length, c['claimsKept'], 'while every claim ever made is still on the cell');
});

test('T66-there-is-no-after — what stands is what the latest epoch says, in whatever order the claims arrived', () => {
  const c = one(sample('yes', 'T66-there-is-no-after'));
  const claims = (c['epochs'] as number[]).map((epoch, i) => ({ origin: `o${i}`, span: { lo: 10 * i, hi: 90 - 10 * i }, epoch }));
  const readings = new Set(orders(claims).map((order) => JSON.stringify(meet(SPAN, cell('x', 0, order)))));
  compare(orders(claims).length, c['orders'], 'every order they could have arrived in');
  compare(readings.size, c['results'], 'leaves one reading');
  compare(Math.max(...claims.map((claim) => claim.epoch)), c['latest'], 'and the latest epoch is what stands');
});

test('T65-ownership-is-being-an-origin — dropping an origin drops what it said and nothing else', () => {
  const c = one(sample('yes', 'T65-ownership-is-being-an-origin'));
  const spans = (c['spans'] as number[][]).map(band);
  const held = cell('x', 0, spans.map((span, i) => ({ origin: `o${i}`, span })));
  compare(pair(meet(SPAN, held)), c['meet'], 'what three origins hold together');
  for (const without of c['without'] as Vector[]) {
    const fewer = cell('x', 0, spans.filter((_, i) => i !== (without['origin'] as number)).map((span, i) => ({ origin: `k${i}`, span })));
    compare(pair(meet(SPAN, fewer)), without['meet'], `without origin ${without['origin']}`);
  }
});

test('T70-a-gap-is-a-coarse-claim — a cell nobody narrowed holds the whole scale, which is what saying nothing says', () => {
  const c = one(sample('yes', 'T70-a-gap-is-a-coarse-claim'));
  const empty = cell('x');
  compare(encounter(SPAN, empty).origins, (c['empty'] as Vector)['origins'], 'a cell with no claim has no origin');
  compare(verdict(empty), (c['empty'] as Vector)['verdict'], 'and is grey');
  compare(meet(SPAN, empty), SPAN.top, 'and holds the whole scale the lattice gives it');
  const narrowed = c['narrowed'] as number[];
  compare(pair(meet(SPAN, observe(empty, { origin: 'o', span: band(narrowed) }))), narrowed, 'one claim narrows it to what it says');
});

test('T63-author-time-memory-are-relative — who, when and what is remembered are three coordinates of one claim', () => {
  const c = one(sample('yes', 'T63-author-time-memory-are-relative'));
  const span = band(c['span'] as number[]);
  const two = cell('x', 0, [{ origin: 'a', span }, { origin: 'b', span }]);
  const twice = cell('x', 0, [{ origin: 'a', span }, { origin: 'a', span }]);
  compare(encounter(SPAN, two).origins, (c['twoOrigins'] as Vector)['origins'], 'two origins saying one thing are two');
  compare(pair(meet(SPAN, two)), (c['twoOrigins'] as Vector)['meet'], 'and hold what they said');
  compare(encounter(SPAN, twice).origins, (c['oneOriginTwice'] as Vector)['origins'], 'one origin saying it twice is one');
  const later = cell('x', 0, [{ origin: 'a', span, epoch: 1 }, { origin: 'b', span, epoch: 3 }]);
  compare(encounter(SPAN, later).origins, (c['differentEpochs'] as Vector)['origins'], 'and an epoch does not make an origin');
  compare(Math.max(...later.seen.map((claim) => claim.epoch ?? 0)), (c['differentEpochs'] as Vector)['latest'], 'the latest epoch is on the claim');
});

test('H6-structure-of-measurement — four instruments with no physics in common, five fields each', () => {
  const c = one(sample('yes', 'H6-structure-of-measurement'));
  const want = c['want'] as Vector;
  for (const row of c['table'] as Vector[]) {
    for (const field of ['floor', 'ceiling', 'origin', 'epoch', 'resolution']) {
      compare(String(row[field] ?? '').length > 3, true, `${row['instrument']}: its ${field} is named`);
    }
    const held = cell(String(row['instrument']).replace(/\s+/g, '-'), 1, [{ origin: 'one', span: { lo: 0, hi: 10 }, epoch: 1 }, { origin: 'two', span: { lo: 4, hi: 20 }, epoch: 1 }]);
    compare(pair(meet(SPAN, held)), want['meet'], `${row['instrument']}: the same operations answer for it`);
    compare(verdict(held), want['verdict'], `${row['instrument']}: and give it the same verdict`);
  }
  compare((c['table'] as Vector[]).length, want['instruments'], 'four rows');
  compare(c['properties'], want['fields'], 'five fields');
  compare(sample('no', 'H6-structure-of-measurement').cases[0]['expected.ok'], false);
});

test('H7-the-medium-of-encounters — what carries an encounter is what two origins both reach', () => {
  const c = one(sample('yes', 'H7-the-medium-of-encounters'));
  const want = c['want'] as Vector;
  compare((c['media'] as string[]).length, want['media'], 'one medium for each instrument');
  for (const medium of c['media'] as string[]) compare(medium.length > 6, true, 'each one named');
  const shared = cell('m', 0, [{ origin: 'a', span: { lo: 0, hi: 10 } }, { origin: 'b', span: { lo: 5, hi: 20 } }]);
  const apartCells = [cell('m1', 0, [{ origin: 'a', span: { lo: 0, hi: 10 } }]), cell('m2', 0, [{ origin: 'b', span: { lo: 5, hi: 20 } }])];
  compare(verdict(shared), want['shared'], 'two origins at one cell make information');
  for (const alone of apartCells) compare(verdict(alone), want['apart'], 'and the same two at two cells make none');
  compare(sample('no', 'H7-the-medium-of-encounters').cases[0]['expected.ok'], false);
});

test('H8-refereed-game — five properties, five readings, and a referee no player can suspend', () => {
  const c = one(sample('yes', 'H8-refereed-game'));
  const want = c['want'] as Vector;
  compare((c['properties'] as string[]).length, want['properties'], 'five properties');
  compare((c['readings'] as string[]).length, want['readings'], 'five readings');
  const alone = cell('x', 0, [{ origin: 'a', span: { lo: 0, hi: 10 } }]);
  compare(verdict(alone), want['alone'], 'a claim alone is potential');
  compare(verdict(observe(alone, { origin: 'b', span: { lo: 4, hi: 20 } })), want['met'], 'two that meet are information');
  const resting = cell('x', 0, [{ origin: 'a', span: { lo: 0, hi: 10 } }], ['b']);
  compare(pair(meet(SPAN, resting, sign(SPAN, new Map(), 'b', { lo: 0, hi: 4 }))), want['signed'], 'a signature moves what rests on it');
  compare(verdict(observe(alone, { origin: 'a', span: { lo: 0, hi: 10 } })), want['closed'], 'and no player closes its own cell');
  compare(sample('no', 'H8-refereed-game').cases[0]['expected.ok'], false);
});

test('D11-the-obligatory — obligatory — the object against the cases that were written before it', () => {
  const v = sample('yes', 'obligatory');
  const [poles, states, travels, takes, splits, phase] = v.cases as Vector[];
  const claim = (id: string, origin: string, lo: number, hi: number) => ({ id, origin, span: { lo, hi } });
  const price = cell('price', 0, ((poles!['interval'] as Vector)['claims'] as number[][]).map((one, i) => claim(`c${i}`, `o${i}`, one[0]!, one[1]!)));
  compare(pair(meet(SPAN, price)), (poles!['interval'] as Vector)['meet'], 'the same cell folds over an interval lattice');
  const ladder = chain((poles!['alphabet'] as Vector)['levels'] as string[]);
  const held = cell('role', 0, [
    { origin: 'x', span: unit('role', { floor: (poles!['alphabet'] as Vector)['floor'] as string, ceiling: 'all' }) },
    { origin: 'y', span: unit('role', { floor: 'none', ceiling: (poles!['alphabet'] as Vector)['ceiling'] as string }) },
  ]);
  const got = meet(fromScale(ladder), held);
  compare(`${got.floor}..${got.ceiling}`, `${(poles!['alphabet'] as Vector)['floor']}..${(poles!['alphabet'] as Vector)['ceiling']}`, 'and over an alphabet it is given');
  const scale = chain(states!['levels'] as string[]);
  for (const [name, want] of [['oneOrigin', 'state'], ['twoThatFit', 'state'], ['twoOutside', 'state'], ['twoTouchingUnderTheCeiling', 'state']] as const) {
    const row = states![name] as Vector;
    compare(state(scale, unit('r', { floor: row['floor'] as string, ceiling: row['ceiling'] as string })), row[want], `${name}: the state the lattice names`);
  }
  const corners = new Set(['oneOrigin', 'twoThatFit', 'twoOutside', 'twoTouchingUnderTheCeiling']
    .map((name) => (states![name] as Vector)['state']));
  compare(corners.size, states!['corners'], 'and all four corners are reached');
  const world = [0, 1, 2, 3].map((i) => cell(`c${i}`, 0, [claim(`o${i}`, `own${i}`, 20 * i, 100)], i < (travels!['resting'] as number) ? [travels!['bound'] as string] : []));
  const was = new Map([[travels!['bound'] as string, band(travels!['was'] as number[])]]);
  const now = sign(SPAN, was, travels!['bound'] as string, band(travels!['now'] as number[]));
  const moved = world.filter((one) => JSON.stringify(meet(SPAN, one, was)) !== JSON.stringify(meet(SPAN, one, now)));
  compare(world.filter((one) => one.restsOn.length).length, travels!['resting'], 'the cells that rest on the bound');
  compare(moved.length, travels!['changed'], 'are the cells a signature moves');
  compare(world.flatMap((one) => one.seen).filter((one) => one.span.hi !== 100).length, travels!['claimsEdited'], 'and it edits no claim');
  const three = cell('x', 0, [claim('c1', 'a', 2, 9), claim('c2', 'b', 5, 12)]);
  const back = observe(three, { origin: 'b', span: { lo: 5, hi: 12 }, takes: takes!['withdrawn'] as string });
  compare(encounter(SPAN, back).origins, takes!['originsAfter'], 'a withdrawal names the claim it takes back');
  compare(back.seen.length, takes!['keptAfter'], 'and leaves every claim on the cell');
  compare(refine(cell(splits!['deep'] as string), splits!['at'] as number).at.join('/'), splits!['reads'], 'refine splits');
  const flat = { lo: 0, hi: 0 };
  compare(interfere(Array.from({ length: phase!['n'] as number }, (_, i) => ({ origin: `o${i}`, epoch: 8, span: flat })), phase!['period'] as number), phase!['inPhase'], 'and claims at one turn add as the square of their number');
  const nos = sample('no', 'obligatory').cases as Vector[];
  const input = (one: Vector): Vector => one['input'] as Vector;
  const [bare, reals, word, edits, still, byValue, reaches, narrows, nobody] = nos;
  compare(meet(SPAN, cell('bare', 0, [], [input(bare!)['rests'] as string])), SPAN.top, bare!['name'] as string);
  const levels = chain(input(reals!)['levels'] as string[]);
  const two = cell('role', 0, (input(reals!)['claims'] as string[][]).map(([floor, ceiling], i) => ({ origin: `r${i}`, span: unit('role', { floor: floor!, ceiling: ceiling! }) })));
  const alphabetMeet = meet(fromScale(levels), two);
  compare([alphabetMeet.floor, alphabetMeet.ceiling], reals!['want'], reals!['name'] as string);
  compare(state(chain(input(word!)['levels'] as string[]), unit('w', { floor: input(word!)['floor'] as string, ceiling: input(word!)['ceiling'] as string })), word!['want'], word!['name'] as string);
  const leaning = (claimed: number[]) => [cell('lean', 0, [{ origin: 'own', span: band(claimed) }], ['ceiling'])];
  compare(pair(sign(SPAN, leaning(input(edits!)['claim'] as number[]), 'ceiling', band(input(edits!)['signed'] as number[]))[0]!.seen[0]!.span), edits!['want'], edits!['name'] as string);
  compare(pair(meet(SPAN, sign(SPAN, leaning(input(still!)['claim'] as number[]), 'ceiling', band(input(still!)['signed'] as number[]))[0]!)), still!['want'], still!['name'] as string);
  const twins = cell('x', 0, (input(byValue!)['claims'] as (string | number)[][]).map(([id, origin, lo, hi]) => ({ id: id as string, origin: origin as string, span: { lo: lo as number, hi: hi as number } })));
  compare(encounter(SPAN, observe(twins, { origin: 'b', span: { lo: 5, hi: 12 }, takes: input(byValue!)['takes'] as string })).origins, byValue!['wantOrigins'], byValue!['name'] as string);
  const signedFour = sign(SPAN, [0, 1, 2, 3].map((i) => cell(`t${i}`, 0, [{ origin: `own${i}`, span: { lo: 0, hi: 100 } }], i < (input(reaches!)['resting'] as number) ? ['ceiling'] : [])), 'ceiling', band(input(reaches!)['signed'] as number[]));
  const opened = signedFour.map((one, i) => (i === 0 ? widen(SPAN, one, band(input(reaches!)['join'] as number[]), 'the owner of t0') : one));
  compare([1, 2].map((i) => pair(meet(SPAN, opened[i]!))), [reaches!['wantOthers'], reaches!['wantOthers']], reaches!['name'] as string);
  const [kept] = sign(SPAN, leaning([0, 100]), 'ceiling', band(input(narrows!)['signed'] as number[]));
  compare(pair(meet(SPAN, widen(SPAN, kept!, band(input(narrows!)['join'] as number[]), 'someone'))), narrows!['want'], narrows!['name'] as string);
  compare(throws(() => widen(SPAN, kept!, band(input(nobody!)['join'] as number[]), input(nobody!)['witness'] as string), new RegExp(nobody!['throws'] as string)), true, nobody!['name'] as string);
  const board = (v.cases as Vector[])[7]!;
  const bits = (span: { readonly lo: number; readonly hi: number }): number => Math.round(Math.log2(span.hi - span.lo + 1) * 1000) / 1000;
  const bound = board['bound'] as string;
  const start = sign(SPAN, [0, 1, 2, 3].map((i) => cell(`b${i}`, 0, [{ origin: `own${i}`, span: { lo: 0, hi: 100 } }], i < (board['resting'] as number) ? [bound] : [])), bound, band(board['was'] as number[]));
  const steps = [...(board['signs'] as number[][]).map((span) => (w: typeof start) => sign(SPAN, w, bound, band(span))),
    (w: typeof start) => w.map((one, i) => (i === 0 ? widen(SPAN, one, band(board['join'] as number[]), 'the owner of b0') : one))];
  const orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const ends = orders.map((order) => order.reduce((w, k) => steps[k]!(w), start));
  compare(ends.length, board['orderings'], 'six orderings of two signatures and a join');
  compare(new Set(ends.map((w) => JSON.stringify([1, 2].map((i) => meet(SPAN, w[i]!))))).size, board['restingResults'], 'signatures commute: what only rests reads one field');
  compare(new Set(ends.map((w) => JSON.stringify(meet(SPAN, w[0]!)))).size, board['joinedResults'], 'a signature and a join on one cell do not');
  compare(pair(meet(SPAN, ends[0]![0]!)), board['joinLast'], 'a join after the signatures widens');
  compare(pair(meet(SPAN, ends[4]![0]!)), board['joinFirst'], 'a join before them is narrowed by what comes after');
  const narrowedAll = steps[1]!(start);
  const openedOne = steps[2]!(narrowedAll);
  compare(bits(meet(SPAN, start[0]!)), board['bitsWas'], 'freedom before');
  compare(bits(meet(SPAN, narrowedAll[0]!)), board['bitsAfterSign'], 'a signature closes it');
  compare(bits(meet(SPAN, openedOne[0]!)), board['bitsAfterJoin'], 'a join opens it');
  compare([0, 1, 2, 3].filter((i) => bits(meet(SPAN, narrowedAll[i]!)) < bits(meet(SPAN, start[i]!))).length, board['signLowers'], 'where a signature reaches');
  compare([0, 1, 2, 3].filter((i) => bits(meet(SPAN, openedOne[i]!)) > bits(meet(SPAN, narrowedAll[i]!))).length, board['joinRaises'], 'and only where a join stands');
});

test('T73-a-cell-that-folds-itself-converges — its freedom settles, and it never conflicts', () => {
  const c = one(sample('yes', 'T73-a-cell-that-folds-itself-converges'));
  const [lo, hi] = c['start'] as number[];
  const bits = (s: { readonly lo: number; readonly hi: number }): number => Math.log2(s.hi - s.lo + 1);
  const runs = (c['seeds'] as number[]).map((seed) => selfFold(SPAN, cell('self', 0, [{ origin: 'first', span: { lo: lo!, hi: hi! } }]),
    c['epochs'] as number, c['width'] as number, c['spread'] as number, seed).map((one) => meet(SPAN, one)));
  const settled = runs.flatMap((held) => held.slice(-(c['last'] as number)).map(bits));
  const round = (x: number): number => Math.round(x * 100) / 100;
  compare([round(Math.min(...settled)), round(Math.max(...settled))], c['settled'], 'freedom settles in a narrow band');
  compare(runs.flat().filter((held) => held.hi < held.lo).length, c['conflicts'], 'and the cell never conflicts');
  compare(Math.min(...settled) > (c['limit'] as number), true, 'approaching log2(11 - 2s) from above');
});

test('H9-the-obligatory-is-maximal — seven removals leave seven objects already known', () => {
  const c = one(sample('yes', 'H9-the-obligatory-is-maximal'));
  const want = c['want'] as Vector;
  const spans = (c['spans'] as number[][]).map(band);
  const withOrigins = cell('x', 0, spans.map((span, i) => ({ origin: `o${i}`, span })));
  const seen: string[] = [];
  compare(meet(SPAN, withOrigins), spans.reduce((held, span) => SPAN.meet(held, span), SPAN.top), 'without origins: the lattice meet');
  seen.push('origins');
  const [signs] = [c['signed'] as number[][]];
  compare(sign(SPAN, [cell('free')], 'b', band(signs![0]!))[0]!.ceiling, undefined, 'without rests: a cell nothing reaches');
  seen.push('rests');
  compare(meet(SPAN, cell('bare')), SPAN.top, 'without a ceiling: the lattice itself');
  seen.push('ceiling');
  compare(observe(cell('x', c['epoch'] as number), { origin: 'o', span: spans[0]! }).epoch, c['epoch'], 'without an epoch: a timeless set of claims');
  seen.push('epoch');
  compare(refine(cell(c['deep'] as string), 1).at.join('/'), c['deep'], 'without resolution: a flat map');
  seen.push('resolution');
  const log = cell('x', 0, spans.map((span, i) => ({ origin: `o${i}`, span })));
  compare(encounter(SPAN, observe(log, { origin: 'o1', span: spans[1]!, takes: 'nobody' })).origins, want['ids'], 'without ids: a log that cannot take back');
  seen.push('ids');
  const narrowed = signs!.reduce((w, span) => sign(SPAN, w, 'b', band(span)), [cell('r', 0, [], ['b'])]);
  compare(pair(narrowed[0]!.ceiling!), signs!.reduce((held, span) => [Math.max(held[0]!, span[0]!), Math.min(held[1]!, span[1]!)], [-1000, 1000]), 'without join: a ceiling that only narrows');
  seen.push('join');
  compare(seen.length, c['removals'], 'seven parts, seven known objects');
});

