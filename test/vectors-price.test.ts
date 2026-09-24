import { asUnit, chain, conj, declaration, disj, fuse, holds, touches, unit } from '@lapxo/obligations';
import type { Level, Scale } from '@lapxo/obligations';
import { attainable, best, classifyValue, collapses, costOfState, gap, isSupermodular, premium, price } from '@lapxo/obligations/price';
import { b2, cheapJoin, heightWorth, load, scaleFrom, squareWorth } from './vectors-harness.ts';

function bestByStructure(
  c: Scale,
  value: (level: Level) => number,
  u: Level,
  w: Level,
): { readonly cost: number; readonly at: Level } {
  let cost = Infinity;
  let at = c.bottomIx;
  for (let p = 0; p < c.levels.length; p++) {
    if (!c.leq(p, u)) continue;
    for (let q = 0; q < c.levels.length; q++) {
      if (!c.leq(q, w)) continue;
      const s = c.higher(p, q);
      const { shortfall, overshoot } = costOfState(c, value, u, w, s);
      const cs = shortfall + overshoot;
      if (cs < cost) {
        cost = cs;
        at = s;
      }
    }
  }
  return { cost, at };
}

test('vectors/premium: the true optimum, and the licence of gated', () => {
  for (const c of load('premium').cases) {
    const o = c.chain ? chain(c.chain) : b2();
    const worth =
      c.worth === 'height' ? heightWorth(o) : c.worth === 'square' ? squareWorth : (i: Level) => i;
    const u = o.rank(c.u);
    const w = o.rank(c.w);
    const p = price(o, worth, u, w);
    compare(p.coarse, c.coarse, `${c.name}: coarse`);
    compare(p.best, c.best, `${c.name}: best`);
    compare(p.premium, c.premium, `${c.name}: premium`);
    compare(p.gain, c.gain, `${c.name}: gain`);
    compare(p.licensed, c.licensed, `${c.name}: licensed`);
    compare(collapses(o, worth, u, w), c.licensed, `${c.name}: collapses is the licence`);
    compare(premium(o, worth, u, w), c.premium);
    compare(best(o, worth, u, w).cost, bestByStructure(o, worth, u, w).cost);
    compare(Math.abs(gap(o, worth, u, w) - c.premium) < 1e-9, true, `${c.name}: gap`);
    const cs = costOfState(o, worth, u, w, p.at);
    compare(Math.abs(cs.shortfall + cs.overshoot - p.best) < 1e-9, true);
  }
  for (const spec of load('premium').crossed?.scales ?? []) {
    const o = scaleFrom(spec);
    const worth = heightWorth(o);
    for (let u = 0; u < o.levels.length; u++) {
      for (let w = 0; w < o.levels.length; w++) {
        compare(best(o, worth, u, w).cost, bestByStructure(o, worth, u, w).cost, `${o.levels[u]}/${o.levels[w]}: the sweep and the structure disagree`);
        compare(Math.abs(gap(o, worth, u, w) - premium(o, worth, u, w)) < 1e-9, true, `${o.levels[u]}/${o.levels[w]}: the closed gap is not the premium`);
      }
    }
  }
});

test('thm-collapse — vectors/supermodular: g ≡ 0 exactly when the valuation is supermodular', () => {
  for (const c of load('supermodular').cases) {
    const o = c.chain ? chain(c.chain) : b2();
    const worth =
      c.worth === 'height'
        ? heightWorth(o)
        : c.worth === 'square'
          ? squareWorth
          : c.worth === 'cheap'
            ? cheapJoin
            : (i: Level) => i;
    compare(isSupermodular(o, worth), c.supermodular, c.name);
    if (c.supermodular) {
      for (let u = 0; u < o.levels.length; u++)
        for (let w = 0; w < o.levels.length; w++)
          compare(Math.abs(premium(o, worth, u, w)) < 1e-9, true, `${c.name}: g at ${u}/${w}`);
    }
  }
});

test('touches and holds disagree on a twin — from the vector', () => {
  const v = load('touches-holds');
  for (const c0 of v.cases) {
    const c = chain(c0.levels as string[]);
    const units = (c0.units as { floor: string; ceiling: string }[]).map((u) => unit('s', u));
    const folded = fuse(c, units);
    units.forEach((u, i) => {
      compare(touches(c, u, folded), (c0.touches as boolean[])[i], `${c0.name}: touches[${i}]`);
      compare(holds(c, units, i), (c0.holds as boolean[])[i], `${c0.name}: holds[${i}]`);
    });
  }
});

test('attainable names holes and refuses them — from the vector', () => {
  const v = load('attainable');
  const c0 = v.cases[0]!;
  const c = chain(c0.levels as string[]);
  const a = attainable(c);
  compare(a.holes.map((h) => h.value), c0.holes as string[]);
  const kinds = c0.kinds as Record<string, string>;
  for (const lvl of c0.levels as string[]) compare(classifyValue(c, lvl).kind, kinds['levels']);
  for (const h of c0.holes as string[]) compare(classifyValue(c, h).kind, kinds['holes']);
  for (const u of c0.unknown as string[]) compare(classifyValue(c, u).kind, kinds['unknown']);
});

test('declaration conj raises demand and lowers the limit — from the vector', () => {
  const v = load('declaration');
  const c0 = v.cases[0]!;
  const c = chain(c0.levels as string[]);
  const x = declaration(c, unit('s', c0.a as { floor: string; ceiling: string }));
  const y = declaration(c, unit('s', c0.b as { floor: string; ceiling: string }));
  const anded = conj(c, x, y);
  const ored = disj(c, x, y);
  const wantAnd = c0.conj as { floor: string; ceiling: string };
  const wantOr = c0.disj as { floor: string; ceiling: string };
  compare(c.levels[anded.demand], wantAnd.floor);
  compare(c.levels[anded.limit], wantAnd.ceiling);
  compare(c.levels[ored.demand], wantOr.floor);
  compare(c.levels[ored.limit], wantOr.ceiling);
  const back = asUnit(c, anded, 's');
  compare(back.floor, wantAnd.floor);
});
