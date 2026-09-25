import { intervals } from '@lapxo/obligations/forms';
import { bites, cancels, cell, interfere, laminar, looksLeft, meet, observe, pairs, parts, pay, price, region, require, restOf, restingOn, sign, state, within } from '@lapxo/obligations/views/field';
import type { Obligatory, Origin, World } from '@lapxo/obligations/views/field';
import { sample, throws } from './vectors-harness.ts';
import type { Vector } from './vectors-harness.ts';

type Band = { readonly lo: number; readonly hi: number };
const SPAN = intervals(-1000, 1000);
const LOW = SPAN.top.lo;
const HIGH = SPAN.top.hi;
const band = (pair: readonly number[]): Band => ({ lo: pair[0]!, hi: pair[1]! });
const one = (name: string): Vector => (sample('yes', name).cases as Vector[])[0]!;
const nos = (name: string): readonly Vector[] => sample('no', name).cases as Vector[];
const draw = (seed: number): (() => number) => {
  let held = seed;
  return () => { held = (held * 1103515245 + 12345) % 2147483648; return held / 2147483648; };
};
const normal = (next: () => number): number => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
const bits = (span: Band): number => (span.lo > span.hi ? 0 : Math.log2(span.hi - span.lo + 1));
const round = (x: number, digits: number): number => Math.round(x * 10 ** digits) / 10 ** digits;
const at = (i: number): Origin => ({ name: `o${i}`, phase: 0 });
const phased = (phases: readonly number[]): readonly Origin[] => phases.map((phase, i) => ({ ...at(i), phase }));
const ratio = (origins: readonly Origin[]): number => { const got = pairs(origins); return got.forks / got.closes; };

test('T85-withdrawal-is-an-anti-claim — in phase a claim and its withdrawal leave the cell grey, with every bit it closed open again', () => {
  const c = one('T85-withdrawal-is-an-anti-claim');
  const held = cell<Band>('x', 0, [{ id: 'h', origin: 'first', span: band(c['held']) }]);
  const claimed = observe(held, { id: 'k', origin: 'second', span: band(c['claim']), at: c['epoch'] });
  const back = observe(claimed, { id: 'k', origin: 'second', span: band(c['claim']), at: c['epoch'] }, -1);
  compare([state(SPAN, held), state(SPAN, claimed), state(SPAN, back)], c['states'], 'grey, two origins, and grey again');
  compare([held, claimed, back].map((one) => round(bits(meet(SPAN, one)), 3)), c['bits'], 'the bits it closed are open again');
  compare(round(price(bits, meet(SPAN, held), meet(SPAN, claimed)), 3), c['price'], 'the claim cost what it closed');
  const wave = (epoch: number, withdraws: boolean) => ({ origin: 'second', epoch, span: band(c['claim']), withdraws });
  compare(interfere([wave(c['epoch'], false), wave(c['epoch'], true)], c['period']), c['left'], 'and in phase the two leave nothing');
  for (const k of nos('T85-withdrawal-is-an-anti-claim')) {
    compare(interfere([wave(k['input']['epochs'][0], false), wave(k['input']['epochs'][1], true)], k['input']['period']), k['want'], k);
  }
});

test('T87-the-quarter-turn — two phases cancel exactly beyond a quarter turn, and at the median spread half the pairs fork', () => {
  const c = one('T87-the-quarter-turn');
  const steps = c['grid'] as number;
  let apart = 0;
  for (let i = 0; i < steps; i += 1) {
    for (let j = 0; j < steps; j += 1) {
      const [a, b] = [(2 * Math.PI * i) / steps, (2 * Math.PI * j) / steps];
      const summed = (Math.cos(a) + Math.cos(b)) ** 2 + (Math.sin(a) + Math.sin(b)) ** 2;
      const turned = Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) > Math.PI / 2;
      const fork = cancels({ name: 'a', phase: a }, { name: 'b', phase: b });
      if (fork !== summed < 2 || fork !== turned) apart += 1;
    }
  }
  compare(apart, 0, 'read three ways, the quarter turn agrees on every pair of the grid');
  const sigma = Math.PI / (2 * (c['median'] as number) * Math.SQRT2);
  const next = draw(c['seed'] as number);
  const drawn = Array.from({ length: c['trials'] as number }, () => [normal(next) * sigma, normal(next) * sigma] as const);
  const forked = drawn.filter(([a, b]) => cancels({ name: 'a', phase: a }, { name: 'b', phase: b })).length;
  const linear = drawn.filter(([a, b]) => Math.abs(a - b) > Math.PI / 2).length;
  compare(round(linear / drawn.length, 3), c['linear'], 'at σ = π/(2·0.6745·√2) half the differences exceed a quarter turn on the line');
  compare([round(forked / drawn.length, 3), round(forked / (drawn.length - forked), 2)], c['fork'], 'but the quarter turn wraps, so fewer than half the pairs cancel and forks stay under closes');
  const field = (spread: number): readonly Origin[] => phased(Array.from({ length: c['field'] as number }, () => normal(next) * spread));
  compare([ratio(field(sigma / 2)) < 1, ratio(field(sigma)) < 1], c['laminar'], 'one coherence is laminar at the median spread and below it');
  for (const k of nos('T87-the-quarter-turn')) compare(cancels({ name: 'a', phase: k['input']['a'] }, { name: 'b', phase: k['input']['b'] }), k['want'], k);
});

test('T88-turbulence-is-factions — even phases fork as often as they close; two facing camps just over one, a third in quadrature well under', () => {
  const c = one('T88-turbulence-is-factions');
  const next = draw(c['seed'] as number);
  let [forks, closes] = [0, 0];
  for (let trial = 0; trial < (c['trials'] as number); trial += 1) {
    const got = pairs(phased(Array.from({ length: c['origins'] as number }, () => 2 * Math.PI * next())));
    [forks, closes] = [forks + got.forks, closes + got.closes];
  }
  compare(round(forks / closes, 3), c['uniform'], 'phases spread evenly: forks over closes is one');
  const camp = (centre: number): readonly number[] => Array.from({ length: c['camp'] as number }, () => centre + (next() - 0.5) * (c['noise'] as number));
  const two = [...camp(0), ...camp(Math.PI)];
  compare(round(ratio(phased(two)), 2), c['twoCamps'], 'two equal camps facing each other: just over one');
  compare(round(ratio(phased([...two, ...camp(Math.PI / 2)])), 2), c['thirdCamp'], 'a third coherence in quadrature brings it down');
  for (const k of nos('T88-turbulence-is-factions')) {
    compare(round(ratio(phased(Array.from({ length: k['input']['origins'] as number }, () => normal(next) * (k['input']['sigma'] as number)))), 1), k['want'], k);
  }
});

test('T89-disagreement-is-where-to-look — looks spent where origins cancel close more cells than looks spent blind to it', () => {
  const c = one('T89-disagreement-is-where-to-look');
  const next = draw(c['seed'] as number);
  const start = Array.from({ length: c['cells'] as number }, () => [2 * Math.PI * next(), 2 * Math.PI * next()]);
  const play = (alpha: number): number => {
    const cells = start.map((phases) => [...phases]);
    const was = cells.map((phases) => laminar(phased(phases)));
    const pick = draw(c['draw'] as number);
    for (let look = 0; look < (c['looks'] as number); look += 1) {
      const score = cells.map((phases) => alpha * (pairs(phased(phases)).forks / Math.max(1, phases.length * (phases.length - 1) / 2)) + (1 - alpha) * pick());
      const i = score.indexOf(Math.max(...score));
      const phases = cells[i]!;
      phases.push(Math.atan2(phases.reduce((s, p) => s + Math.sin(p), 0), phases.reduce((s, p) => s + Math.cos(p), 0)));
    }
    return cells.filter((phases, i) => !was[i] && laminar(phased(phases))).length;
  };
  compare([play(1), play(0)], c['closed'], 'weight one on disagreement against indifference');
  compare(play(1) > play(0), c['more'], 'disagreement is where to look');
  for (const k of nos('T89-disagreement-is-where-to-look')) compare(play(k['input']['alpha'] as number) > play(1), k['want'], k);
});

test('T90-freedom-is-entropy — freedom is the entropy of the states left, no narrowing act raises it, and two paths interfere from phase alone', () => {
  const c = one('T90-freedom-is-entropy');
  const entropy = (n: number): number => -Array.from({ length: n }, () => 1 / n).reduce((s, p) => s + p * Math.log2(p), 0);
  compare((c['widths'] as number[]).every((w) => Math.abs(bits({ lo: 0, hi: w }) - entropy(w + 1)) < 1e-9), c['entropy'], 'log₂ of the states between the poles is their entropy');
  const next = draw(c['seed'] as number);
  const pick = (lo: number, hi: number): number => lo + Math.floor(next() * (hi - lo + 1));
  let [raised, restored] = [0, 0];
  for (let field = 0; field < (c['fields'] as number); field += 1) {
    const lo = pick(0, 50);
    const held = cell<Band>(`f${field}`, 0, [{ id: 'a', origin: 'a', span: { lo, hi: pick(lo, 100) } }], ['b']);
    const world: World<Band> = new Map();
    const before = bits(meet(SPAN, held, world));
    const kind = field % 3;
    const after = kind === 0 ? meet(SPAN, observe(held, { id: 'n', origin: 'n', span: { lo: pick(0, 60), hi: pick(40, 100) } }), world)
      : kind === 1 ? meet(SPAN, held, sign(SPAN, world, 'b', { lo: LOW, hi: pick(0, 100) })) : meet(SPAN, held, require(SPAN, world, 'b', { lo: pick(0, 100), hi: HIGH }));
    if (bits(after) > before + 1e-12) raised += 1;
    if (bits(meet(SPAN, observe(observe(held, { id: 'n', origin: 'n', span: { lo: 40, hi: 60 } }), { id: 'n', origin: 'n', span: { lo: 40, hi: 60 } }, -1), world)) === before) restored += 1;
  }
  compare(raised, 0, 'over every field no narrowing act raised the freedom');
  compare(restored, c['fields'], 'and every withdrawal gave back exactly what its claim closed');
  const path = (epoch: number) => ({ origin: 'path', epoch, span: { lo: 0, hi: 0 } });
  const period = c['period'] as number;
  const contrast = (seen: readonly number[]): number => round((Math.max(...seen) - Math.min(...seen)) / (Math.max(...seen) + Math.min(...seen)), 2);
  const together = Array.from({ length: period }, (_, delay) => interfere([path(0), path(delay)], period));
  const kicks = draw(c['kicks'] as number);
  const observed = Array.from({ length: period }, (_, delay) => Array.from({ length: c['trials'] as number }, () => interfere([path(0), path(delay + Math.floor(kicks() * period))], period)).reduce((s, x) => s + x, 0) / (c['trials'] as number));
  compare([contrast(together), contrast(observed)], c['contrast'], 'the fringes of two paths, and what is left once each is observed');
  for (const k of nos('T90-freedom-is-entropy')) {
    const narrow = cell<Band>('n', 0, [{ origin: 'a', span: band(k['input']['held']) }]);
    compare(bits(meet(SPAN, observe(narrow, { origin: 'b', span: band(k['input']['wider']) }))) > bits(meet(SPAN, narrow)), k['want'], k);
  }
});

test('T91-many-objects-make-a-field — thirty cells meet or fork pairwise, the meets join them in two components, and the whole has no meet', () => {
  const c = one('T91-many-objects-make-a-field');
  const next = draw(c['seed'] as number);
  const places = Array.from({ length: c['places'] as number }, (_, i) => {
    const lo = (i < (c['split'] as number) ? (c['left'] as number) : (c['right'] as number)) + Math.floor(next() * 2 * (c['width'] as number));
    return cell<Band>(`p${i}`, 0, [{ origin: `o${i}`, span: { lo, hi: lo + (c['width'] as number) } }]);
  });
  const held = places.map((one) => meet(SPAN, one));
  const root = held.map((_, i) => i);
  const find = (i: number): number => (root[i] === i ? i : (root[i] = find(root[i]!)));
  let [meets, forks] = [0, 0];
  for (let i = 0; i < held.length; i += 1) {
    for (let j = i + 1; j < held.length; j += 1) {
      if (SPAN.inhabited(SPAN.meet(held[i]!, held[j]!))) { meets += 1; root[find(i)] = find(j); } else forks += 1;
    }
  }
  const whole = held.reduce((acc, one) => SPAN.meet(acc, one), SPAN.top);
  compare([meets, forks, new Set(held.map((_, i) => find(i))).size, SPAN.inhabited(whole)], c['field'], 'meets, forks, components and whether the whole meets');
  for (const k of nos('T91-many-objects-make-a-field')) {
    const spans = (k['input']['spans'] as number[][]).map(band);
    compare(!SPAN.inhabited(spans.reduce((acc, one) => SPAN.meet(acc, one), SPAN.top)), k['want'], k);
  }
});

test('T92-a-cell-is-made-of-cells — read one step deeper most cells change state, the reading is the meet of the parts, and a third step changes nothing', () => {
  const c = one('T92-a-cell-is-made-of-cells');
  const next = draw(c['seed'] as number);
  const span = (): Band => { const lo = Math.floor(next() * 60); return { lo, hi: lo + 10 + Math.floor(next() * 50) }; };
  const cells = Array.from({ length: c['cells'] as number }, () => Array.from({ length: 1 + Math.floor(next() * (c['parts'] as number)) },
    () => Array.from({ length: 1 + Math.floor(next() * (c['depth'] as number)) }, span)));
  const read = (parts: readonly (readonly Band[])[], deep: number) => cell<Band>('x', 0, parts.map((words, i) => ({ origin: `o${i}`, span: words.slice(0, deep).reduce((acc, one) => SPAN.meet(acc, one), SPAN.top) })));
  const at = (deep: number) => cells.map((parts) => state(SPAN, read(parts, deep)));
  const [first, second, third] = [at(1), at(2), at(3)];
  const flat = cells.map((parts) => state(SPAN, cell<Band>('x', 0, parts.flatMap((words, i) => words.slice(0, 2).map((span) => ({ origin: `o${i}`, span }))))));
  compare([first.filter((one, i) => one !== second[i]).length, first.filter((one, i) => one === 'FREE' && second[i] === 'FREE').length, second.filter((one, i) => one !== third[i]).length], c['moved'], 'changed at two, green that survived, changed at three');
  compare(second.every((one, i) => one === flat[i]), c['meetOfParts'], 'a cell read at two is the meet of its parts read at one');
  for (const k of nos('T92-a-cell-is-made-of-cells')) compare(at(k['input']['depth'] as number).filter((one, i) => one !== flat[i]).length > 0, k['want'], k);
});

test('T93-every-act-is-paid-by-its-origin — the observer is a cell whose ceiling is its looks, reach is a meet of regions, and no act is free', () => {
  const c = one('T93-every-act-is-paid-by-its-origin');
  let world: World<Band> = require(SPAN, sign(SPAN, new Map(), 'observer', { lo: LOW, hi: c['looks'] as number }), 'observer', { lo: 0, hi: HIGH });
  for (let k = 0; k < (c['taken'] as number); k += 1) world = pay(SPAN, world, 'observer');
  compare(looksLeft(SPAN, world, 'observer'), c['left'], 'each look narrows the observer by one');
  const cells = (c['cells'] as string[]).map((name) => cell<Band>(name));
  compare(cells.filter((one) => within(one, region(c['region'] as string))).length, c['reach'], 'its reach is where its region meets theirs');
  for (const k of nos('T93-every-act-is-paid-by-its-origin')) {
    const spent = require(SPAN, sign(SPAN, new Map(), 'observer', { lo: LOW, hi: k['input']['looks'] as number }), 'observer', { lo: 0, hi: HIGH });
    compare(!throws(() => pay(SPAN, spent, 'observer')), k['want'], k);
  }
});

const tree = (size: number, seed: number, share: number): World<Band> => {
  const next = draw(seed);
  const out = new Map<string, Obligatory<Band>>([['c0', cell<Band>('c0')]]);
  for (let i = 1; i < size; i += 1) {
    const one = cell<Band>(`c${i}`, 0, [], [`c${Math.floor(next() * i)}`]);
    out.set(`c${i}`, next() < share ? { ...one, marks: [{ pole: 'ceiling', reach: 'travels', span: { lo: LOW, hi: Math.floor(next() * 100) } }] } : one);
  }
  return out;
};

test('T94-a-signature-stops-where-the-meet-is-identity — an absorbed signature visits one cell, a light one a few, a heavy one most', () => {
  const c = one('T94-a-signature-stops-where-the-meet-is-identity');
  const world = sign(SPAN, tree(c['cells'] as number, c['seed'] as number, c['share'] as number), 'c0', { lo: LOW, hi: c['root'] as number });
  const resting = restingOn(world);
  const cost = (hi: number) => bites(SPAN, world, resting, 'c0', { lo: LOW, hi });
  const [absorbed, light, heavy] = [c['absorbed'], c['light'], c['heavy']].map((hi) => cost(hi as number));
  compare([absorbed!.visits, light!.visits, heavy!.visits], c['visits'], 'what each signature visits');
  compare([absorbed!.cells.length, light!.cells.length, heavy!.cells.length], c['bitten'], 'and what each bites');
  const signed = sign(SPAN, world, 'c0', { lo: LOW, hi: c['light'] as number });
  const changed = [...world.keys()].filter((name) => parts(SPAN, world.get(name)!, world).ceiling.hi !== parts(SPAN, signed.get(name)!, signed).ceiling.hi);
  compare(changed.sort().join('|') === [...light!.cells].sort().join('|'), c['exact'], 'what it bites is what a reading of every cell finds changed');
  for (const k of nos('T94-a-signature-stops-where-the-meet-is-identity')) compare(cost(k['input']['hi'] as number).visits, k['want'] === 'all' ? world.size : k['want'], k);
});

test('T95-signatures-live-where-they-are-signed — a signature is one line at its bound, an absorbed one stays live, and withdrawing the tighter reveals it', () => {
  const c = one('T95-signatures-live-where-they-are-signed');
  const base = tree(c['cells'] as number, c['seed'] as number, 0);
  const lines = (world: World<Band>): number => [...world.values()].reduce((sum, one) => sum + (one.marks?.length ?? 0), 0);
  const wide = sign(SPAN, base, 'c0', { lo: LOW, hi: c['wide'] as number }, { id: 'wide' });
  const tight = sign(SPAN, wide, 'c0', { lo: LOW, hi: c['tight'] as number }, { id: 'tight' });
  const back = sign(SPAN, tight, 'c0', { lo: LOW, hi: c['tight'] as number }, { takes: 'tight' });
  const next = draw(c['seed'] as number);
  const probe = Array.from({ length: c['probes'] as number }, () => `c${Math.floor(next() * (c['cells'] as number))}`);
  const read = (world: World<Band>) => probe.map((name) => parts(SPAN, world.get(name)!, world).ceiling.hi);
  compare([lines(wide) - lines(base), lines(tight) - lines(wide), lines(back) - lines(tight)], c['lines'], 'every act is one line');
  compare([...new Set(read(tight))], [c['tight']], 'the tighter is read everywhere');
  compare([...new Set(read(back))], [c['wide']], 'and taking it back reveals the one it absorbed');
  const replay = sign(SPAN, sign(SPAN, sign(SPAN, base, 'c0', { lo: LOW, hi: c['tight'] as number }, { takes: 'tight' }), 'c0', { lo: LOW, hi: c['tight'] as number }, { id: 'tight' }), 'c0', { lo: LOW, hi: c['wide'] as number }, { id: 'wide' });
  compare(read(replay).join('|') === read(back).join('|'), c['replay'], 'a replay in another order reads the same');
  for (const k of nos('T95-signatures-live-where-they-are-signed')) compare([...new Set(read(replay))], k['want'], k);
});

test('T99-the-fold-is-total — every fold over a rest order without cycles answers in finitely many steps, and a cycle is refused', () => {
  const c = one('T99-the-fold-is-total');
  const next = draw(c['seed'] as number);
  let [answered, refused, steps] = [0, 0, 0];
  for (let w = 0; w < (c['worlds'] as number); w += 1) {
    const size = 2 + Math.floor(next() * (c['size'] as number));
    const cells = Array.from({ length: size }, (_, i) => cell<Band>(`c${i}`, 0, [{ origin: `o${i}`, span: { lo: 0, hi: 100 } }], i === 0 ? [] : [`c${Math.floor(next() * i)}`]));
    let world: World<Band> = new Map(cells.map((one) => [one.at.join('/'), one] as const));
    world = sign(SPAN, world, 'c0', { lo: LOW, hi: Math.floor(next() * 100) });
    for (const one of world.values()) { steps += restOf(one, world).length; meet(SPAN, one, world); }
    answered += 1;
    const cycled = new Map([...world, ['c0', { ...world.get('c0')!, restsOn: [`c${size - 1}`] }]]);
    if (throws(() => [...cycled.values()].forEach((one) => restOf(one, cycled)), /REFUSE·rest/)) refused += 1;
  }
  compare([answered, refused], [c['worlds'], c['worlds']], 'every fold answers, and every world with a cycle is refused');
  compare(steps <= (c['worlds'] as number) * (c['size'] as number) ** 2, c['finite'], 'in finitely many steps');
  for (const k of nos('T99-the-fold-is-total')) {
    const loop = new Map([['a', cell<Band>('a', 0, [], ['b'])], ['b', cell<Band>('b', 0, [], ['a'])]]);
    compare(!throws(() => restOf(loop.get(k['input']['from'] as string)!, loop)), k['want'], k);
  }
});

test('T100-an-act-is-paid-with-attention — looks closed and freedom left sum to what the field holds, and it settles where closing equals forgetting', () => {
  const c = one('T100-an-act-is-paid-with-attention');
  const [cells, width, looks, epochs, forget] = ['cells', 'width', 'looks', 'epochs', 'forget'].map((key) => c[key] as number) as [number, number, number, number, number];
  const whole = cells * bits({ lo: 0, hi: width - 1 });
  const field = Array.from({ length: cells }, (_, i) => cell<Band>(`c${i}`, 0, [{ origin: `own${i}`, span: { lo: 0, hi: width - 1 } }]));
  const last = new Array<number>(cells).fill(-forget);
  const [sums, held] = [[] as number[], [] as number[]];
  let closed = 0;
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    let attention: World<Band> = require(SPAN, sign(SPAN, new Map(), 'observer', { lo: LOW, hi: looks }), 'observer', { lo: 0, hi: HIGH });
    for (let i = 0; i < cells; i += 1) {
      if (epoch - last[i]! !== forget) continue;
      const before = meet(SPAN, field[i]!);
      field[i] = observe(field[i]!, { origin: 'observer', span: { lo: 0, hi: 0 }, id: `l${i}-${last[i]}` }, -1);
      closed -= price(bits, meet(SPAN, field[i]!), before);
    }
    const order = field.map((_, i) => i).sort((a, b) => last[a]! - last[b]! || a - b);
    for (const i of order) {
      if (epoch - last[i]! < forget || throws(() => pay(SPAN, attention, 'observer'))) continue;
      attention = pay(SPAN, attention, 'observer');
      const before = meet(SPAN, field[i]!);
      field[i] = observe(field[i]!, { origin: 'observer', span: { lo: 0, hi: 0 }, id: `l${i}-${epoch}` });
      closed += price(bits, before, meet(SPAN, field[i]!));
      last[i] = epoch;
    }
    sums.push(round(field.reduce((sum, one) => sum + bits(meet(SPAN, one)), 0) + closed, 6));
    held.push(closed);
  }
  compare([...new Set(sums)], [round(whole, 6)], 'freedom left and what the looks closed sum to the whole at every epoch');
  compare(round(held.slice(-forget).reduce((s, x) => s + x, 0) / forget, 1), c['steady'], 'what one attention holds settles');
  compare(round(looks * forget * bits({ lo: 0, hi: width - 1 }), 1), c['bound'], 'at its looks over the forgetting');
  for (const k of nos('T100-an-act-is-paid-with-attention')) compare(Math.max(...held) > (k['input']['looks'] as number) * forget * bits({ lo: 0, hi: width - 1 }), k['want'], k);
});
