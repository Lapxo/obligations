import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The four colours a screen shows the four states in, read from the view the wire signs and never from a word here. */
const COLOUR: Readonly<Record<string, string>> = Object.fromEntries(
  (/value=(\S+)/.exec(readFileSync(join(import.meta.dirname, '..', '..', 'topos', 'views', 'colour.bound'), 'utf8'))?.[1] ?? '')
    .split('|').map((one) => one.split(':') as [string, string]),
);
import { alphabetForm, alphabets, continuousForm, ladderForm, latticeForm, answers, chain, coarsen, contracts, converge, covers, declarationOf, degenerate, endsBeforeNow, exclusive, foldIn, foldRegion, foldSigned, freedom, intervals, key, latest, meetAt, movesOf, order, origins, outranks, passes, point, potential, premiumOf, present, region, registerOf, resolution, retracted, size, stateOf, sufficientResolution, turned, unit, verified, violationsIn, withdrawsExactly, within } from '@lapxo/obligations';
import type { Point, Region, Scale, Sighting } from '@lapxo/obligations';
import { disagree } from '@lapxo/obligations/encounter';
import { replay } from '@lapxo/obligations/replay';
const verdictOf = (place: { readonly seen: readonly { readonly origin: string }[] }): string => {
  const one = new Set(place.seen.map((s) => s.origin)).size < 2;
  return one ? 'grey' : disagree(place as never) ? 'split' : 'agreed';
};
import { load, throws } from './vectors-harness.ts';
import type { Vector } from './vectors-harness.ts';

const SPAN = intervals(-Infinity, Infinity);
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const at = (name: string, seen: readonly Sighting[] = [], epoch = 0): Point => point(name, epoch, seen);
const regions = (names: readonly string[]): Region[] => names.map((name) => region(name));

/** A case holds when its checks agree with what it expects: a falsifier holds by failing. */
const holds = (c: Vector, ok: boolean): boolean => compare(ok, true, c);

function each(v: Vector, check: (c: Vector) => boolean): void {
  for (const c of v.cases as Vector[]) check(c);
}

test('field — a coordinate, its resolution, the steps it passes, the regions it refines', () => {
  each(load('field'), (c) => {
    if ('passes' in c) return passes(region(c.coordinate), c.step) === c.passes;
    if ('within' in c) return within(point(c.point, 0, [], c.steps ?? '/'), region(c.region, c.steps ?? '/')) === c.within;
    if ('resolution' in c) return resolution(region(c.coordinate)) === c.resolution;
    if ('exclusive' in c) {
      const kept = exclusive(regions(c.mine), (c.others as string[][]).map(regions));
      return same(kept.map((one) => one.at.join('/')), c.exclusive);
    }
    if ('contracts' in c) return contracts(regions(c.regions), (c.touched as string[]).map((t) => point(t))) === c.contracts;
    return false;
  });
});

test('region — identity by coordinates, the regions a change touches, and the wildcards', () => {
  each(load('region'), (c) => {
    if ('within' in c) return within(point(c.point), region(c.region)) === c.within;
    if ('change' in c) return same((c.regions as string[]).filter((r) => within(point(c.change), region(r))), c.touched);
    return (key(regions(c.a)) === key(regions(c.b))) === c.same;
  });
});

test('render — a region read at a resolution folds what lands on one coarse coordinate', () => {
  each(load('render'), (c) => {
    const read = (c.at as string[]).map((name) => coarsen(point(name), c.steps));
    const folds = foldRegion(read, region(''), (met) => met.length);
    return same(Object.fromEntries(folds.map((f) => [f.at, f.value])), c.render);
  });
});

test('fold — what a point holds is the meet of its origins, in any order', () => {
  each(load('fold'), (c) => {
    const held = meetAt(at('x', c.seen));
    const folded = foldIn(SPAN, (c.seen as Sighting[]).map((s) => s.span));
    const replayed = replay([at('x', c.seen)], region(''), (met) => meetAt(met[0]!));
    return same(held, c.meet) && same(folded, held) && same(replayed.map((f) => f.value), [held]);
  });
});

const emitted = (form: Vector, params: unknown, value: unknown): unknown => {
  const e = form.emit(params, value);
  if (e.want) return { want: [...e.want].sort() };
  return 'floor' in e ? { floor: e.floor, ceiling: e.ceiling } : e;
};
const wanted = (w: Vector): unknown => (w.want ? { want: [...w.want].sort() } : w);
const formOf = (id: string): Vector => [ladderForm, alphabetForm, continuousForm, latticeForm].find((f) => f.id === id) as Vector;

test('A2-meet — meet — every form meets two bounds, and says whether anything survives', () => {
  each(load('meet'), (c) => {
    const form = formOf(c.form);
    const L = form.lattice(c.params);
    const a = form.parse(c.params, c.a);
    const b = form.parse(c.params, c.b);
    const met = L.meet(a, b);
    return violationsIn(L, [a, b, met]).length === 0 && L.inhabited(met) === c.inhabited && (!c.meet || same(emitted(form, c.params, met), wanted(c.meet)));
  });
});

test('A2-meet — join — every form joins two bounds, the bottom included', () => {
  each(load('join'), (c) => {
    const form = formOf(c.form);
    const L = form.lattice(c.params);
    const b = c.b === 'bottom' ? L.bottom : form.parse(c.params, c.b);
    return same(emitted(form, c.params, L.join(form.parse(c.params, c.a), b)), wanted(c.join));
  });
});

test('laws-as-folds — each law is one fold over the points met in a region', () => {
  each(load('laws-as-folds'), (c) => {
    const met = (c.points as Vector[]).map((p) => point(p.at, p.epoch));
    if (c.law === 'group-by') return same(foldRegion(met, region(c.region), (m) => m.length), c.folds);
    if (c.law === 'covers') return covers(met, { where: regions(c.where), steps: c.steps, when: c.when }) === c.value;
    if (c.law === 'outranks') return outranks(met, c.named, c.order) === c.value;
    if (c.law === 'answers') return answers(met, regions(c.where)) === c.value;
    if (c.law === 'verified') return verified(met, (p) => (c.green as number[]).includes(p.epoch)) === c.value;
    if (c.law === 'retracted') return same(retracted(met, regions(c.by)).map((p) => p.at.join('/')), c.value);
    return false;
  });
});

const pair = (d: readonly [Sighting, Sighting] | null): string[] | null => (d ? [d[0].origin, d[1].origin] : null);

test('encounter — origins, colour, what they hold together, and the pair that splits', () => {
  const v = load('encounter');
  each(v, (c) => {
    const p = at('x', c.seen);
    return origins(p) === c.origins
      && verdictOf(p) === c.colour
      && (!c.meet || same(meetAt(p), c.meet))
      && (!c.disagree || same(pair(disagree(p)), c.disagree));
  });
  const read = (points: Vector[]): Point[] => points.map((p) => at(p.at, p.seen));
  compare(turned(read(v.turned.before), read(v.turned.after)).map((p) => p.at.join('/')), v.turned.expected);
});

test('drift — several homes are several origins; an error only where they stop agreeing', () => {
  each(load('drift'), (c) => {
    const p = at('q', c.seen);
    return origins(p) === c.homes && verdictOf(p) === c.colour && (!c.disagree || same(pair(disagree(p)), c.disagree));
  });
});

test('questions — the size of a body of claims is its distinct coordinates at a resolution', () => {
  each(load('questions'), (c) => size(c.at, c.steps) === c.size);
});

const scaleOf = (s: Vector): Scale => s.kind === 'chain'
  ? chain(s.levels)
  : order(s.levels, (s.levels as string[]).map((x) => (s.levels as string[]).map((y) => x === y
    || x === s.levels[0]
    || y === s.levels[s.levels.length - 1]
    || (s.below as string[][]).some(([lo, hi]) => lo === x && hi === y))));
const spans = (xs: readonly (readonly [number, number])[]): Point =>
  at('x', xs.map(([lo, hi], i) => ({ origin: `o${i}`, span: { lo, hi } })));

test('field-uses — a point is read as a declaration, and the price and the debit answer the rest', () => {
  each(load('field-uses'), (c) => {
    const s = scaleOf(c.scale);
    const value = c.valuation ? (level: number) => (c.valuation as number[])[level]! : null;
    const checks: boolean[] = [];
    if (c.declaration) checks.push(same(declarationOf(s, spans(c.spans)), c.declaration));
    if (c.state) checks.push(stateOf(s, spans(c.spans)) === c.state);
    if (c.render) checks.push(COLOUR[stateOf(s, spans(c.spans))] === c.render);
    if (c.register) checks.push(same(registerOf(s, spans(c.spans)), c.register));
    if (c.moves) {
      const m = movesOf(s, spans(c.before), spans(c.after)) as Record<string, Record<string, number>>;
      const got = Object.entries(m).flatMap(([a, row]) => Object.entries(row).filter(([, n]) => n > 0).map(([b, n]) => [`${a}→${b}`, n]));
      checks.push(same(got.sort(), Object.entries(c.moves).sort()));
    }
    if ('degenerate' in c) checks.push(degenerate(s, value!) === c.degenerate);
    if ('premium' in c) checks.push(premiumOf(s, value!, spans(c.spans)) === c.premium);
    if ('withdrawsExactly' in c) checks.push(withdrawsExactly(s) === c.withdrawsExactly);
    return checks.length > 0 && holds(c, checks.every(Boolean));
  });
});

/** L22b: the present is the meet of the bands, potential while one origin holds it. */
const presentMeet = (c: Vector): boolean => holds(c, same(present(point('x', c.t, c.bands)), c.present));
/** L22c: the width moves by maturation minus forgetting; with no leading claim the present ends before now. */
const presentConvergence = (c: Vector): boolean => holds(c, 'now' in c
  ? endsBeforeNow(c.now, c.leading, c.lagging) === c.ends_before_now
  : converge(c.width, c.maturation, c.forgetting, c.epochs).trend === c.trend);
/** L33: the coarsest resolution whose verdict equals the finest one. */
const sufficiency = (c: Vector): boolean => {
  const got = 'points' in c
    ? sufficientResolution(c.finest, (steps) => size(c.points, steps))
    : sufficientResolution(c.finest, (steps) => (c.verdicts as number[])[steps - 1]);
  return holds(c, 'sufficient' in c ? got === c.sufficient : (got < c.finest) === c.sufficient_coarser);
};
/** L20b: read coarser, a claim never reaches fewer regions. */
const coarsening = (c: Vector): boolean => {
  const reach = (from: Region): number => (c.regions as string[]).filter((r) => within(region(r), from)).length;
  const fine = reach(region(c.claim));
  const coarse = reach(c.finer !== undefined ? region(c.finer) : coarsen(point(c.claim), c.steps));
  return fine === c.fits && coarse === c.fits_coarse && holds(c, coarse >= fine);
};
/** L00: a coordinate exists only where two origins met at one epoch; one origin leaves it potential, none empty. */
const existence = (c: Vector): boolean => {
  const met: Sighting[] = (c.points as Vector[])
    .filter((p) => p.at === c.at && p.epoch === c.epoch)
    .map((p) => ({ origin: p.origin, span: { lo: 0, hi: 0 } }));
  const here = at(c.at, met, c.epoch);
  const state = origins(here) === 0 ? 'empty' : potential(here) ? 'potential' : 'exists';
  return holds(c, state === c.state);
};

test('freedom — bits of freedom are log2 of the states between a floor and a ceiling', () => {
  each(load('freedom'), (c) => holds(c, Math.abs(freedom(scaleOf(c.scale), unit('x', { floor: c.floor, ceiling: c.ceiling })) - c.bits) < 1e-9));
});

test('present-meet — the present is the meet of the bands, potential with one origin (L22b)', () => {
  each(load('info/present-meet'), presentMeet);
});

test('T6-present-converges — present-convergence — the width moves by maturation minus forgetting (L22c)', () => {
  each(load('info/present-convergence'), presentConvergence);
});

test('T7-sufficient-resolution — sufficient-resolution — the coarsest resolution whose verdict equals the finest (L33)', () => {
  each(load('info/sufficient-resolution'), sufficiency);
});

test('T5-coarsen-widens — coarsen-fit — read coarser, a claim never reaches fewer regions (L20b)', () => {
  each(load('info/coarsen-fit'), coarsening);
});

test('falsifier — a coordinate exists only where two origins met at one epoch (L00)', () => {
  each(load('info/falsifier'), existence);
});

test('observation-close — only readings at or after the close stand, the latest of them', () => {
  each(load('info/observation-close'), (c) => {
    const read = (c.readings as Vector[]).map((r) => point('x', r.epoch, [{ origin: 'o', span: { lo: r.span[0], hi: r.span[1] } }]));
    const after = read.filter((p) => covers([p], { where: [region('x')], steps: { lo: 0, hi: Infinity }, when: { lo: c.close, hi: Infinity } }));
    return (latest(after)?.epoch ?? null) === c.stands;
  });
});

test('D7-fork — ledger — equal values are one encounter, the narrower stands, the rest fork', () => {
  each(load('atom/ledger'), (c) => {
    const values = (c.landed as Vector[]).map((x) => ({ polarity: 'permit' as const, values: new Set<string>(x.permit) }));
    const folded = foldSigned(alphabets(), values);
    const standing = folded.standing.map((k) => [...values[Math.max(...folded.classes[k]!)]!.values].sort());
    if (!same(standing.sort(), (c.standing as string[][]).map((s) => [...s].sort()).sort())) return false;
    if (c.shown_epoch === undefined) return true;
    const shown = latest(folded.classes[folded.standing[0]!]!.map((i) => point('x', c.landed[i].epoch)));
    return shown?.epoch === c.shown_epoch;
  });
});

test('verdict — a region is answered when all that moved lies in it and no verified origin answers red', () => {
  each(load('atom/verdict'), (c) => {
    const fact = answers((c.moved as string[]).map((m) => point(m)), regions(c.region))
      && !(c.origins as Vector[]).some((o) => o.red && o.verified);
    return (fact ? 'fact' : 'refuse') === c.verdict;
  });
});

test('T4-composition — locks-are-targets — a lock and a target fold like two targets', () => {
  each(load('atom/locks-are-targets'), (c) => {
    const a = at('x', c.seen);
    const b = at('x', c.as_two);
    return verdictOf(a) === c.colour && verdictOf(b) === c.colour && same(meetAt(a), meetAt(b)) && (!c.meet || same(meetAt(a), c.meet));
  });
});

test('A5-origin-is-extension — states-not-actions — a state folded twice is folded once', () => {
  each(load('atom/states-not-actions'), (c) => {
    if (c.origins !== undefined) return origins(at('x', c.seen)) === c.origins;
    const bands = (xs: number[][]) => xs.map(([lo, hi]) => ({ lo: lo!, hi: hi! }));
    return same(foldIn(SPAN, bands(c.spans)), foldIn(SPAN, bands(c.once)));
  });
});

test('derived — a coarser reading keeps its origins, and what a point holds is no new origin (L01)', () => {
  each(load('atom/derived'), (c) => {
    const p = at(c.at ?? 'x', c.seen);
    if (c.steps !== undefined) return origins(coarsen(p, c.steps)) === c.origins;
    return same(meetAt(p), c.holds) && origins(p) === c.origins;
  });
});

test('T3-fixed-point — formula — the form, its operation and its inputs fix the value', () => {
  each(load('atom/formula'), (c) => {
    const form = formOf(c.form);
    const L = form.lattice(c.params);
    const [a, b] = (c.inputs as unknown[]).map((x) => form.parse(c.params, x));
    return same(emitted(form, c.params, L[c.op](a, b)), wanted(c.value));
  });
});

;
