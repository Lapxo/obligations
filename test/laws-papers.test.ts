import { chain } from '@lapxo/obligations';
import type { Level, Scale } from '@lapxo/obligations';
import { gap, premium, price } from '@lapxo/obligations/price';
import { b2, heightWorth, n5, partitionScale, productOfChains, sample } from './vectors-harness.ts';
import type { Vector } from './vectors-harness.ts';

const entropy = (ps: readonly number[]): number => ps.reduce((h, p) => (p > 0 ? h - p * Math.log2(p) : h), 0);

/** Two subsystems under one joint measure: the product of what each answers, valued by the entropy of the pair. */
function subsystems(joint: readonly (readonly number[])[]): {
  whole: Scale; worth: (i: Level) => number; at: (a: number, b: number) => Level;
  hx: number; hy: number; i: number;
} {
  const hx = entropy(joint.map((row) => row.reduce((s, v) => s + v, 0)));
  const hy = entropy(joint[0]!.map((_, j) => joint.reduce((s, row) => s + row[j]!, 0)));
  const hxy = entropy(joint.flat());
  const whole = productOfChains([2, 2]);
  const worth = (i: Level): number => {
    const [a, b] = whole.levels[i]!.split(',').map(Number);
    return a && b ? hxy : a ? hx : b ? hy : 0;
  };
  return { whole, worth, at: (a, b) => whole.rank(`${a},${b}`), hx, hy, i: hx + hy - hxy };
}

const alone = (worth: number, u: number, w: number): { viol: number; g: number } => {
  const s = chain(['l0', 'l1']);
  const f = (i: Level): number => (i ? worth : 0);
  return { viol: price(s, f, u, w).coarse, g: premium(s, f, u, w) };
};

const corners: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [0, 1], [1, 1]];
const each = (fn: (u: readonly [number, number], w: readonly [number, number]) => void): void => {
  for (const u of corners) for (const w of corners) fn(u, w);
};
const close = (got: number, want: number): boolean => Math.abs(got - want) < 1e-9;

test('thm-mi — demand the first subsystem, permit only the second: the premium is the mutual information', () => {
  for (const c of sample('yes', 'thm-mi').cases as Vector[]) {
    const { whole, worth, at, hx, i } = subsystems(c.joint);
    const p = price(whole, worth, at(1, 0), at(0, 1));
    compare(close(p.coarse, c['hx']) && close(hx, c['hx']), true, `${c.name}: the conflict is H(X)`);
    compare(Boolean(close(p.best, c['hx_given_y'])), true, `${c.name}: the retreat is H(X|Y)`);
    compare(close(p.premium, c['i']) && close(i, c['i']), true, `${c.name}: the premium is I(X;Y)`);
    compare(Boolean(close(gap(whole, worth, at(1, 0), at(0, 1)), c['i'])), true, `${c.name}: the gap agrees with the premium`);
    compare(close(alone(c['hx'], 1, 0).g, 0) && close(alone(c['hy'], 0, 1).g, 0), true, `${c.name}: neither factor prices anything`);
  }
});

test('prop-dep — both costs decompose: the factors, plus what the joint says over them', () => {
  for (const c of sample('yes', 'prop-dep').cases as Vector[]) {
    const { whole, worth, at, hx, hy } = subsystems(c.joint);
    const dependence = (a: number, b: number): number => worth(at(a, b)) - (a ? hx : 0) - (b ? hy : 0);
    let held = 0;
    each((u, w) => {
      const m = [Math.min(u[0], w[0]), Math.min(u[1], w[1])] as const;
      const j = [Math.max(u[0], w[0]), Math.max(u[1], w[1])] as const;
      const p = price(whole, worth, at(u[0], u[1]), at(w[0], w[1]));
      const viol = alone(hx, u[0], w[0]).viol + alone(hy, u[1], w[1]).viol;
      const g = alone(hx, u[0], w[0]).g + alone(hy, u[1], w[1]).g;
      const ri = dependence(u[0], u[1]) + dependence(w[0], w[1]) - dependence(j[0], j[1]) - dependence(m[0], m[1]);
      compare(Boolean(close(p.coarse, viol + dependence(u[0], u[1]) - dependence(m[0], m[1]))), true, `${c.name}: the conflict at ${u}/${w}`);
      compare(Boolean(close(p.premium, g + ri)), true, `${c.name}: the premium at ${u}/${w}`);
      held += 1;
    });
    compare(held, c['declarations'], `${c.name}: every declaration on the product`);
    const crossed = price(whole, worth, at(1, 0), at(0, 1));
    compare(close(crossed.coarse, c['crossed'].viol) && close(crossed.premium, c['crossed'].g), true, `${c.name}: the crossed declaration`);
    const top = price(whole, worth, at(1, 1), at(0, 0));
    compare(close(top.coarse, c['top'].viol) && close(dependence(1, 1), c['top'].dependence), true, `${c.name}: everything demanded, nothing permitted`);
  }
});

test('thm-dep — the conflict is discounted by dependence and the premium inflated, never by more', () => {
  for (const c of sample('yes', 'thm-dep').cases as Vector[]) {
    const { whole, worth, at, hx, hy, i } = subsystems(c.joint);
    let held = 0;
    each((u, w) => {
      const p = price(whole, worth, at(u[0], u[1]), at(w[0], w[1]));
      const viol = alone(hx, u[0], w[0]).viol + alone(hy, u[1], w[1]).viol;
      const g = alone(hx, u[0], w[0]).g + alone(hy, u[1], w[1]).g;
      compare(p.coarse >= viol - i - 1e-9 && p.coarse <= viol + 1e-9, true, `${c.name}: the conflict at ${u}/${w}`);
      compare(Math.abs(p.premium - g) <= i + 1e-9, true, `${c.name}: the premium at ${u}/${w}`);
      held += 1;
    });
    compare(held, c['declarations'], `${c.name}: every declaration on the product`);
    compare(Boolean(close(i, c['i'])), true, `${c.name}: the mutual information`);
    compare(Boolean(close(price(whole, worth, at(1, 1), at(0, 0)).coarse, c['floor'].viol)), true, `${c.name}: the lower end is reached`);
    compare(Boolean(close(price(whole, worth, at(1, 0), at(0, 1)).premium, c['crossed'].g)), true, `${c.name}: the upper premium end is reached`);
  }
});

const pairs = (scale: Scale, fn: (x: Level, y: Level) => void): number => {
  let seen = 0;
  for (let x = 0; x < scale.levels.length; x += 1) for (let y = 0; y < scale.levels.length; y += 1) { fn(x, y); seen += 1; }
  return seen;
};
const residual = (s: Scale, worth: (i: Level) => number, x: Level, y: Level): number =>
  worth(x) + worth(y) - worth(s.higher(x, y)) - worth(s.lower(x, y));
/** What the places of one block still tell apart, read from the blocks that fall inside it. */
const inside = (blocks: readonly number[][], block: readonly number[]): number => blocks
  .map((b) => b.filter((e) => block.includes(e))).filter((b) => b.length)
  .reduce((h, b) => h - (b.length / block.length) * Math.log2(b.length / block.length), 0);
const sigma = (n: number, worth: (i: Level) => number, i: Level): number => n * (Math.log2(n) - worth(i));
const held = new Map<number, ReturnType<typeof partitionScale>>();
const places = (n: number): ReturnType<typeof partitionScale> => held.get(n) ?? held.set(n, partitionScale(n)).get(n)!;
const phi = (t: number): number => sigma(t, places(t).worth, places(t).scale.bottomIx);

test('prop-cmi — the residual information of two readings is what they share once their meet is given', () => {
  for (const c of sample('yes', 'prop-cmi').cases as Vector[]) {
    const { scale, blocks, worth, at } = places(c['places']);
    const seen = pairs(scale, (x, y) => {
      const given = blocks[scale.lower(x, y)]!.reduce((t, b) => t + (b.length / c['places'])
        * (inside(blocks[x]!, b) + inside(blocks[y]!, b) - inside(blocks[scale.higher(x, y)]!, b)), 0);
      compare(Boolean(close(residual(scale, worth, x, y), given)), true, `${c.name}: ${scale.levels[x]} and ${scale.levels[y]}`);
    });
    compare(seen, c['pairs'], `${c.name}: every pair`);
    for (const pin of c['pins'] as Vector[]) compare(Boolean(close(residual(scale, worth, at(pin.x), at(pin.y)), pin.ri)), true, `${c.name}: ${JSON.stringify(pin.x)}`);
  }
});

test('lem-meet — a pair splits over the blocks of its meet, and each block is bounded by what a trivial meet can reach', () => {
  for (const c of sample('yes', 'lem-meet').cases as Vector[]) {
    const n = c['places'] as number;
    const { scale, blocks, worth, at } = places(n);
    const tau = (c['tau'] as number[]);
    const seen = pairs(scale, (x, y) => {
      const met = blocks[scale.lower(x, y)]!;
      const split = met.reduce((t, b) => {
        const part = places(b.length);
        const keep = (p: readonly number[][]): Level => part.at(p.map((q) => q.filter((e) => b.includes(e)).map((e) => b.indexOf(e))).filter((q) => q.length));
        return t + (b.length / n) * residual(part.scale, part.worth, keep(blocks[x]!), keep(blocks[y]!));
      }, 0);
      compare(Boolean(close(residual(scale, worth, x, y), split)), true, `${c.name}: ${scale.levels[x]} and ${scale.levels[y]}`);
      compare(residual(scale, worth, x, y) <= met.reduce((t, b) => t + (b.length / n) * tau[b.length - 1]!, 0) + 1e-9, true, `${c.name}: the bound`);
    });
    compare(seen, c['pairs'], `${c.name}: every pair`);
    for (const pin of c['pins'] as Vector[]) {
      compare(Boolean(close(residual(scale, worth, at(pin.x), at(pin.y)), pin.ri)), true, `${c.name}: ${JSON.stringify(pin.x)}`);
      compare(pin.ri <= pin.bound + 1e-9, true, `${c.name}: the bound at ${JSON.stringify(pin.x)}`);
    }
  }
});

test('lem-identity — with a trivial meet the residual information is the scale less the block graph, per place', () => {
  for (const c of sample('yes', 'lem-identity').cases as Vector[]) {
    const n = c['places'] as number;
    const { scale, blocks, worth, at } = places(n);
    const graph = (x: Level, y: Level): number => blocks[x]!.reduce((t, b) => t + blocks[y]!.reduce((s, d) => {
      const over = b.filter((e) => d.includes(e)).length;
      return over ? s + over * Math.log2((b.length * d.length) / over) : s;
    }, 0), 0);
    let seen = 0;
    pairs(scale, (x, y) => {
      if (scale.lower(x, y) !== scale.bottomIx) return;
      seen += 1;
      compare(Boolean(close(residual(scale, worth, x, y), Math.log2(n) - graph(x, y) / n)), true, `${c.name}: ${scale.levels[x]} and ${scale.levels[y]}`);
    });
    compare(seen, c['pairs'], `${c.name}: every trivial-meet pair`);
    for (const pin of c['pins'] as Vector[]) compare(close(graph(at(pin.x), at(pin.y)), pin.phi) && close(residual(scale, worth, at(pin.x), at(pin.y)), pin.ri), true, `${c.name}: ${JSON.stringify(pin.x)}`);
  }
});

test('lem-phi — a block of t places costs at least two for each place past the first, and exactly that only for one and two', () => {
  for (const c of sample('yes', 'lem-phi').cases as Vector[]) {
    for (let t = 1; t <= c['upTo']; t += 1) {
      const cost = phi(t);
      compare(Boolean(close(cost, (c['phi'] as number[])[t - 1]!)), true, `${c.name}: a block of ${t}`);
      compare(cost >= 2 * (t - 1) - 1e-9, true, `${c.name}: the floor at ${t}`);
      compare(Math.abs(cost - 2 * (t - 1)) < 1e-9, (c['equality'] as number[]).includes(t), `${c.name}: equality at ${t}`);
    }
  }
});

test('lem-merge — merging two blocks costs at least two, and exactly two only for two single places', () => {
  for (const c of sample('yes', 'lem-merge').cases as Vector[]) {
    for (const [p, q, step] of c['sizes'] as number[][]) {
      compare(Boolean(close(phi(p! + q!) - phi(p!) - phi(q!), step!)), true, `${c.name}: ${p} and ${q}`);
      compare(step! >= 2 - 1e-9, true, `${c.name}: the floor at ${p} and ${q}`);
      compare(Math.abs(step! - 2) < 1e-9, p === 1 && q === 1, `${c.name}: equality at ${p} and ${q}`);
    }
    const n = c['places'] as number;
    const { scale, blocks, worth } = places(n);
    pairs(scale, (x, y) => {
      if (!scale.leq(x, y)) return;
      compare(sigma(n, worth, x) - sigma(n, worth, y) >= 2 * (blocks[y]!.length - blocks[x]!.length) - 1e-9, true, `${c.name}: ${scale.levels[x]} coarsens ${scale.levels[y]}`);
    });
  }
});

test('thm-ratio — the worst retreat is a demand of two balanced blocks, and the block sizes say by how much', () => {
  for (const c of sample('yes', 'thm-ratio').cases as Vector[]) {
    const n = c['places'] as number;
    const { scale, blocks, worth, at } = places(n);
    compare(scale.levels.length, c['levels'], `${c.name}: the lattice`);
    let worst = 0;
    let arg = scale.bottomIx;
    pairs(scale, (u, w) => {
      const p = price(scale, worth, u, w);
      if (p.coarse <= 1e-12 || p.best <= 1e-12) return;
      if (p.coarse / p.best > worst + 1e-12) { worst = p.coarse / p.best; arg = u; }
    });
    compare(close(worst, c['rho']) && close(worst, c['ratio']), true, `${c.name}: the ratio is what the block sizes say`);
    compare(blocks[arg]!.length === 2, c['balanced'], `${c.name}: attained at two blocks`);
    compare(Boolean(close(worst, price(scale, worth, at(c['at'].u), at(c['at'].w)).coarse / price(scale, worth, at(c['at'].u), at(c['at'].w)).best)), true, `${c.name}: attained where the sample says`);
  }
});

test('lem-join — the most two readings with a trivial meet can share is already reached at a discrete join', () => {
  for (const c of sample('yes', 'lem-join').cases as Vector[]) {
    const n = c['places'] as number;
    const { scale, blocks, worth, at } = places(n);
    let trivial = 0;
    let discrete = 0;
    let most = 0;
    pairs(scale, (x, y) => {
      if (scale.lower(x, y) !== scale.bottomIx) return;
      trivial += 1;
      if (blocks[scale.higher(x, y)]!.length !== n) return;
      discrete += 1;
      most = Math.max(most, residual(scale, worth, x, y));
    });
    compare(trivial, c['trivial'], `${c.name}: every trivial meet`);
    compare(discrete, c['discrete'], `${c.name}: of them, a discrete join`);
    compare(Boolean(close(most, c['tau'])), true, `${c.name}: the most a trivial meet reaches`);
    pairs(scale, (x, y) => {
      if (scale.lower(x, y) !== scale.bottomIx) return;
      compare(residual(scale, worth, x, y) <= most + 1e-9, true, `${c.name}: ${scale.levels[x]} and ${scale.levels[y]} reaches no further`);
    });
    compare(Boolean(close(residual(scale, worth, at(c['at'].x), at(c['at'].y)), most)), true, `${c.name}: reached where the sample says`);
  }
});

const families = (n: number): number[][] => {
  const out: number[][] = [];
  for (let mask = 1; mask < 1 << n; mask += 1) out.push([...Array(n).keys()].filter((i) => mask & (1 << i)));
  return out;
};

test('thm-witness — one against one reports the whole conflict for every valuation exactly at a witness', () => {
  for (const c of sample('yes', 'thm-witness').cases as Vector[]) {
    const s = c['lattice'] === 'b2' ? b2() : n5();
    const tall = heightWorth(s);
    const top = s.levels.reduce((h, _, i) => Math.max(h, tall(i)), 0);
    const step = 1 / (2 * top + 2);
    const all = families(s.levels.length);
    let seen = 0;
    let conflict = 0;
    let witness = 0;
    let anyway = 0;
    for (const A of all) {
      const u = A.reduce((x, a) => s.higher(x, a));
      for (const B of all) {
        const w = B.reduce((x, b) => s.lower(x, b));
        seen += 1;
        const m = s.lower(u, w);
        if (m === u) continue;
        conflict += 1;
        const held = A.includes(u) && B.some((b) => s.lower(u, b) === m);
        if (held) witness += 1;
        const adversary = (x: Level): number => (s.leq(u, x) ? 1 : 0) + step * tall(x);
        const audit = (f: (x: Level) => number): number => Math.max(...A.flatMap((a) => B.map((b) => f(a) - f(s.lower(a, b)))));
        compare(audit(adversary) >= adversary(u) - adversary(m) - 1e-12, held, `${c.name}: ${A} against ${B}`);
        if (!held && audit(tall) >= tall(u) - tall(m) - 1e-12) anyway += 1;
      }
    }
    compare(seen, c['families'], `${c.name}: every declaration`);
    compare(conflict, c['conflict'], `${c.name}: in conflict`);
    compare(witness, c['witness'], `${c.name}: a witness`);
    compare(anyway, c['soundUnderHeight'], `${c.name}: sound under plain height without a witness`);
  }
});
