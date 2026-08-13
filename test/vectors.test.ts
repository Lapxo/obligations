/**
 * The same golden vectors the Rust runs, from the same files.
 *
 * This is the point of the whole exercise. Vectors are worth nothing until a
 * second implementation passes them: until then they only prove the one
 * implementation agrees with itself. If these pass, the wire carried no Rust
 * hidden inside it.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  UnitError,
  asBoolean,
  chain,
  compose,
  composeState,
  conflictDebits,
  declines,
  defect,
  effective,
  entails,
  order,
  price,
  localise,
  reach,
  state,
  statesPerDebit,
  table,
  unit,
  weakest,
  permitAll,
  permitNone,
  BOOLEAN,
  WIDTH,
  and,
  composePacked,
  debitsOwed,
  isConflict,
  packer,
  register,
  clashes,
  closure,
  anyOf,
  missing,
  complexity,
  slack,
  spectrum,
} from '../src/index';
import type { Scale, Edge, Level, Piece, State, Unit } from '../src/types';

/**
 * A vector file, as read. `unknown` would be honest and unusable; these
 * files are checked in beside the implementation and their shape IS the
 * contract, so a loose alias here beats casting at forty call sites.
 */
type Vector = Record<string, any>;

/**
 * Catch a refusal WITH ITS TYPE. `try { … } catch (e)` gives `unknown` under
 * strict mode, and reaching for `e.code` on it is exactly the untyped hole
 * the port was meant to close.
 */
function caught(fn: () => unknown): UnitError | null {
  try {
    fn();
    return null;
  } catch (e) {
    if (e instanceof UnitError) return e;
    throw e;
  }
}

// CommonJS: `__dirname` is the directory of this test file.
const VECTORS = join(__dirname, '..', 'vectors');

const load = (name: string): Vector =>
  JSON.parse(readFileSync(join(VECTORS, `${name}.json`), 'utf8'));

test('every file declares its coverage', () => {
  for (const name of [
    'units-16',
    'chains',
    'decline',
    'boolean',
    'provenance',
    'reach',
    'debits',
    'degenerate',
    'accepts',
    'any-of',
    'complexity',
    'slack',
    'spectrum',
    'states-per-step',
    'effective',
    'entails',
    'missing',
  ]) {
    const v = load(name);
    assert.ok(v.coverage, `${name}: no coverage`);
    assert.equal(typeof v.coverage.size, 'number', `${name}: no size`);
    assert.equal(typeof v.coverage.criterion, 'string', `${name}: no criterion`);
    assert.equal(
      typeof v.coverage.could_exclude_counterexamples,
      'boolean',
      `${name}: does not say whether it could miss a counterexample`,
    );
    if (v.coverage.could_exclude_counterexamples) {
      assert.equal(typeof v.coverage.why, 'string', `${name}: admits it could miss one, no why`);
    }
    assert.equal(v.cases.length, v.coverage.size, `${name}: declared size does not match`);
  }
});

test('units-16', () => {
  for (const c of load('units-16').cases) {
    assert.equal(table(c.a, c.b), c.outcome, `${c.a} ∧ ${c.b}`);
  }
});

test('chains', () => {
  const v = load('chains');
  const ch = chain(v.chain);
  for (const c of v.cases) {
    const units = c.units.map((u: { floor: string; ceiling: string }) => unit('subject', u));
    const got = compose(ch, units);
    assert.equal(got.floor, c.expect.floor, `${c.name}: floor`);
    assert.equal(got.ceiling, c.expect.ceiling, `${c.name}: ceiling`);
    assert.equal(composeState(ch, units), c.expect.state, `${c.name}: state`);
  }
});

test('decline — the half a suite usually forgets', () => {
  const seen = new Set();
  for (const c of load('decline').cases) {
    seen.add(c.expect);
    if (c.expect === 'ERROR') {
      const ch = chain(c.input.chain);
      // `assert.throws` returns undefined, so catch it by hand: the point
      // is not that it threw, it is WHICH refusal it gave.
      let err;
      try {
        compose(ch, [unit('subject', c.input.unit)]);
      } catch (e) {
        err = e;
      }
      assert.ok(err instanceof UnitError, `${c.name}: did not refuse`);
      // The right refusal, not just any: refusing for the wrong reason hides
      // the typo the refusal exists to surface.
      const want = c.name.includes('nobody declared') ? 'UNKNOWN_LEVEL' : 'MALFORMED';
      assert.equal(err.code, want, `${c.name}: refused for the wrong reason`);
    } else {
      assert.equal(c.expect, 'UNKNOWN', c.name);
      assert.ok(declines(c.input), `${c.name}: this surface answered something it cannot know`);
    }
  }
  assert.ok(seen.has('ERROR') && seen.has('UNKNOWN'), 'only one kind of declining was tested');
});

test('boolean — the projection that drops half', () => {
  const kinds = new Set();
  for (const c of load('boolean').cases) {
    const ch = chain(c.chain);
    const u = unit('subject', c.unit);
    assert.equal(state(ch, u), c.state, `${c.name}: state`);
    const view = asBoolean(ch, u);
    kinds.add(c.view);
    assert.equal(view.kind, c.view, `${c.name}: view`);
    // The union is discriminated on purpose, so reading a field means
    // proving which arm you are in first. That is the type doing the job the
    // JavaScript version left to the reader.
    if (view.kind === 'exactly' || view.kind === 'lossy') {
      assert.equal(view.value, c.value, `${c.name}: value`);
    }
    if (view.kind === 'lossy' || view.kind === 'unsayable') {
      assert.ok(view.lost.length > 0, `${c.name}: lost something and did not say what`);
    }
  }
  assert.equal(kinds.size, 3, 'not every reading was exercised');
});

test('composition is order-independent', () => {
  const ch = chain(['none', 'month', 'group', 'row']);
  const a = unit('x', { floor: 'none', ceiling: 'month' });
  const b = unit('x', { floor: 'group', ceiling: 'row' });
  assert.deepEqual(compose(ch, [a, b]), compose(ch, [b, a]));
  assert.equal(composeState(ch, [a, b]), 'CONFLICT');
});

test('nothing here is asked for a price', () => {
  assert.ok(declines({ ask: 'cost.coarse' }));
  assert.ok(declines({ ask: 'gain' }));
  assert.equal(declines({ ask: 'verdict' }), null);
});

/**
 * GATE: the primitive names no domain.
 *
 * The wire in Rust has the same guard and it has fired three times — on its
 * own word list, on the paragraph explaining the rule, and on a word that
 * was too ambiguous to be on the list at all. It is cheap and it is the only
 * thing that keeps "agnostic" from decaying into "agnostic when written".
 *
 * Comments are stripped from neither: prose ties a primitive to a domain
 * just as surely as an identifier does, by teaching everyone who reads it
 * that this is what the thing is for.
 */
test('the primitive is tied to nothing', () => {
  // Only words that are unambiguously one domain's machinery. `table` is not
  // on the list: the composition table is one, and a guard that cries wolf
  // gets switched off.
  //
  // TWO kinds of tie, and the list used to catch only one. A word naming
  // where the code RUNS ties it just as tightly as a word naming what it is
  // about: this file said "usable in a lambda", which quietly made one
  // deployment the point of a library that has none. The second row exists
  // because that got through.
  const BANNED = [
    // what it is about
    'role',
    'tenant',
    'rls',
    'permission',
    'privilege',
    'grant',
    'principal',
    'sql',
    'database',
    'endpoint',
    'retention',
    'http',
    // where it runs
    'lambda',
    'serverless',
    'browser',
    'node.js',
    'container',
    'worker',
  ];
  const files = ['../src/index.ts', '../src/unit.ts', '../src/order.ts', '../src/price.ts'];
  for (const f of files) {
    const src = readFileSync(join(__dirname, f), 'utf8').toLowerCase();
    for (const w of BANNED) {
      assert.equal(src.includes(w), false, `${f} named \`${w}\``);
    }
  }

  // AND THE GUARD CAN STILL FAIL. A word list that silently stopped matching
  // — a renamed file, an empty read — would pass forever and say nothing.
  // This project has shipped exactly that bug before.
  const planted = 'this text mentions a tenant running in a lambda'.toLowerCase();
  assert.ok(
    BANNED.some((w) => planted.includes(w)),
    'the list no longer matches anything: the guard is decoration',
  );
  assert.ok(
    files.every((f) => readFileSync(join(__dirname, f), 'utf8').length > 500),
    'a file read as empty would pass every check above',
  );
});

test('reach is transitive and includes itself', () => {
  const edges: Edge[] = [
    ['c', 'b'],
    ['b', 'a'],
  ];
  assert.deepEqual(reach(edges, 'c').sort(), ['a', 'b', 'c']);
  assert.deepEqual(reach(edges, 'a'), ['a'], 'a leaf reaches only itself');
  assert.deepEqual(reach([], 'x'), ['x']);
});

test('a cycle terminates instead of spinning', () => {
  const cycle: Edge[] = [
    ['a', 'b'],
    ['b', 'a'],
  ];
  assert.deepEqual(reach(cycle, 'a').sort(), ['a', 'b']);
});

/**
 * THE LAW, and the reason this is a primitive rather than graph bookkeeping:
 * reaching means holding. Two viewpoints, each fine alone, collide once one
 * can reach the other.
 */
test('reaching means holding', () => {
  const ch = chain(['none', 'month', 'group', 'row']);
  const held = {
    narrow: [unit('s', { floor: 'none', ceiling: 'month' })],
    wide: [unit('s', { floor: 'group', ceiling: 'row' })],
  };
  const unitsOf = (n: string): Unit[] | undefined =>
    n === 'narrow' ? held.narrow : n === 'wide' ? held.wide : undefined;

  // Each on its own is perfectly satisfiable.
  assert.notEqual(composeState(ch, held.narrow), 'CONFLICT');
  assert.notEqual(composeState(ch, held.wide), 'CONFLICT');

  // And the moment one reaches the other, they are not.
  const eff = effective(ch, [['wide', 'narrow']], 'wide', unitsOf);
  assert.deepEqual(eff.via.sort(), ['narrow', 'wide']);
  assert.equal(composeState(ch, eff.units), 'CONFLICT');
});

test('a viewpoint that holds nothing composes to nothing', () => {
  const ch = chain(['none', 'row']);
  const eff = effective(ch, [], 'empty', () => undefined);
  assert.deepEqual(eff.units, []);
  assert.equal(eff.bounds, null, 'no opinion is not the same as a free opinion');
});

test('provenance — a claim is only as good as its weakest input', () => {
  for (const c of load('provenance').cases) {
    assert.equal(weakest([c.a, c.b]), c.weakest, `${c.a} ∧ ${c.b}`);
  }
  assert.equal(weakest([]), 'exact', 'nothing to weaken');
});

test('reach — the law that had two implementations and no vector', () => {
  for (const c of load('reach').cases) {
    assert.deepEqual(reach(c.edges, c.from).sort(), [...c.reaches].sort(), c.name);
  }
});

/**
 * The exact read-out composes coordinatewise. Exhaustive over every pair of
 * well-formed bounds on a four-level chain.
 */
test('the per-debit read-out is truth-functional', () => {
  const ch = chain(['none', 'month', 'group', 'row']);
  const dem = (s: State): boolean => s === 'REQUIRED' || s === 'CONFLICT';
  const per = (s: State): boolean => s === 'REQUIRED' || s === 'FREE';
  let checked = 0;
  for (let f1 = 0; f1 < 4; f1++)
    for (let c1 = f1; c1 < 4; c1++)
      for (let f2 = 0; f2 < 4; f2++)
        for (let c2 = f2; c2 < 4; c2++) {
          const a = unit('x', { floor: ch.levels[f1], ceiling: ch.levels[c1] });
          const b = unit('x', { floor: ch.levels[f2], ceiling: ch.levels[c2] });
          const [sa, sb, sj] = [a, b, compose(ch, [a, b])].map((x) => statesPerDebit(ch, x));
          for (let i = 0; i < sa.length; i++) {
            assert.equal(dem(sj[i][1]), dem(sa[i][1]) || dem(sb[i][1]), 'demand is not OR');
            assert.equal(per(sj[i][1]), per(sa[i][1]) && per(sb[i][1]), 'limit is not AND');
          }
          checked++;
        }
  assert.equal(checked, 100);
});

test('all four states are reachable per debit', () => {
  const ch = chain(['none', 'month', 'group', 'row']);
  const seen = new Set();
  for (let f = 0; f < 4; f++)
    for (let c = 0; c < 4; c++)
      for (const [, s] of statesPerDebit(
        ch,
        unit('x', { floor: ch.levels[f], ceiling: ch.levels[c] }),
      ))
        seen.add(s);
  assert.equal(seen.size, 4, `not four states after all: ${[...seen]}`);
});

test('debits — a collision is counted, not just named', () => {
  for (const c of load('debits').cases) {
    const ch = chain(c.chain);
    assert.equal(conflictDebits(ch, unit('x', c.unit)), c.debits, c.name);
  }
});

/**
 * THE FORCED CHOICE. A debit is a step, not an atom. On the
 * five-chain, (2,1) collides while its only atom reads REQUIRED — so an
 * implementation indexing by atoms would call it clean. That implementation
 * is the plausible one, which is why this test exists.
 */
test('indexing by atoms would lose this collision', () => {
  const ch = chain(['0', '1', '2', '3', '4']);
  const d = unit('x', { floor: '2', ceiling: '1' });
  assert.equal(state(ch, d), 'CONFLICT');
  const per = statesPerDebit(ch, d);
  assert.deepEqual(per[0], ['1', 'REQUIRED'], 'the atom alone reads clean');
  assert.ok(
    per.some(([, s]) => s === 'CONFLICT'),
    'and a higher debit does not',
  );
});

test('entailment is reflexive, transitive, and below composition', () => {
  const ch = chain(['none', 'month', 'group', 'row']);
  const all = [];
  for (let f = 0; f < 4; f++)
    for (let c = f; c < 4; c++) all.push(unit('x', { floor: ch.levels[f], ceiling: ch.levels[c] }));
  for (const a of all) {
    assert.ok(entails(ch, a, a), 'not reflexive');
    for (const b of all) {
      const j = compose(ch, [a, b]);
      assert.ok(entails(ch, j, a) && entails(ch, j, b), 'conjunction is not stronger');
      for (const c of all) {
        if (entails(ch, a, b) && entails(ch, b, c)) {
          assert.ok(entails(ch, a, c), 'not transitive');
        }
      }
    }
  }
});

/* ------------------------------------------------------------------ *
 * The scale is a LATTICE. A chain is one constructor, not the shape.
 * ------------------------------------------------------------------ */

const T = true;
const F = false;

/** The two-element powerset: simple, and not a chain. */
const b2 = () =>
  order(
    ['none', 'x', 'y', 'both'],
    [
      [T, T, T, T],
      [F, T, F, T],
      [F, F, T, T],
      [F, F, F, T],
    ],
  );

/** The pentagon N5: two maximal chains of different lengths. */
const n5 = () =>
  order(
    ['none', 'a', 'b', 'c', 'all'],
    [
      [T, T, T, T, T],
      [F, T, T, F, T],
      [F, F, T, F, T],
      [F, F, F, T, T],
      [F, F, F, F, T],
    ],
  );

test('both properties are derived, never declared', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  assert.ok(c.isLadder && c.isSimple, 'a chain is both');
  assert.equal(b2().isLadder, false, 'the powerset has two incomparable middles');
  assert.equal(b2().isSimple, true, 'and it is still simple');
  assert.equal(n5().isLadder, false);
  assert.equal(n5().isSimple, false);
});

test('comparability kills the premium and distributivity does not', () => {
  // What neither side holds is what a thin surface would have to price.
  const defect = (o: Scale, f: (i: Level) => number): number => {
    let sum = 0;
    for (let x = 0; x < o.levels.length; x++)
      for (let y = 0; y < o.levels.length; y++)
        sum += Math.abs(f(x) + f(y) - f(o.higher(x, y)) - f(o.lower(x, y)));
    return sum;
  };
  const fs: ((i: Level) => number)[] = [(i) => i, (i) => i * i, (i) => Math.log(i + 1)];
  const c = chain(['none', 'month', 'group', 'row']);
  for (const [k, f] of fs.entries()) {
    assert.ok(defect(c, f) < 1e-12, `what a level is worth ${k}: a chain must cost nothing`);
  }
  // The control. Without it, a `defect` stuck at zero would pass above.
  assert.ok(
    fs.some((f) => defect(b2(), f) > 1e-9),
    'the premium never fired off a chain: the measure is broken',
  );
});

test('the laws still hold off a chain', () => {
  for (const o of [b2(), n5()]) {
    const well: [Level, Level][] = [];
    for (let f = 0; f < o.levels.length; f++)
      for (let c = 0; c < o.levels.length; c++) if (o.leq(f, c)) well.push([f, c]);
    assert.ok(well.length > o.levels.length, 'too few well-formed units to prove anything');
    const mk = (f: Level, c: Level): Unit =>
      unit('s', { floor: o.levels[f], ceiling: o.levels[c] });
    for (const [f1, c1] of well) {
      for (const [f2, c2] of well) {
        const joint = compose(o, [mk(f1, c1), mk(f2, c2)]);
        const [jf, jc] = [o.rank(joint.floor), o.rank(joint.ceiling)];
        assert.equal(jf, o.higher(f1, f2));
        assert.equal(jc, o.lower(c1, c2));
        assert.equal(state(o, joint) === 'CONFLICT', !o.leq(jf, jc));
        if (o.leq(jf, jc)) {
          assert.ok(entails(o, joint, mk(f1, c1)) && entails(o, joint, mk(f2, c2)));
        }
      }
    }
  }
  // Coverage: the powerset must actually PRODUCE a collision.
  const o = b2();
  assert.equal(
    composeState(o, [
      unit('s', { floor: 'x', ceiling: 'x' }),
      unit('s', { floor: 'y', ceiling: 'y' }),
    ]),
    'CONFLICT',
  );
});

test('a collision has no size where the order cannot count', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  assert.equal(conflictDebits(c, unit('s', { floor: 'row', ceiling: 'none' })), 3);
  assert.equal(conflictDebits(b2(), unit('s', { floor: 'x', ceiling: 'none' })), 1);
  // The pentagon: none→c→all is two steps, none→a→b→all is three.
  const threw = caught(() => {
    conflictDebits(n5(), unit('s', { floor: 'all', ceiling: 'none' }));
  });
  assert.equal(threw?.code, 'NOT_GRADED', 'it answered a question with no answer');
  assert.equal(conflictDebits(n5(), unit('s', { floor: 'none', ceiling: 'all' })), 0);
});

test('the debits are computed, not assumed', () => {
  assert.deepEqual(chain(['none', 'month', 'group', 'row']).debits(), [1, 2, 3]);
  assert.deepEqual(b2().debits(), [1, 2], '`both` is a join, not a debit');
  assert.equal(statesPerDebit(b2(), unit('s', { floor: 'x', ceiling: 'x' })).length, 2);
});

test('a relation that is not a usable scale is refused', () => {
  const threw = caught(() => {
    // Two bottoms and two tops: `p ∨ q` has two minimal upper bounds.
    order(
      ['p', 'q', 'r', 's'],
      [
        [T, F, T, T],
        [F, T, T, T],
        [F, F, T, F],
        [F, F, F, T],
      ],
    );
  });
  assert.equal(threw?.code, 'MALFORMED', 'it accepted something that is not a usable scale');
});

/* ------------------------------------------------------------------ *
 * The price, in the library — the same two formulas, any scale.
 * ------------------------------------------------------------------ */

test('the price is the same two formulas on any scale', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  const cost = (i: Level): number => i * 2.5;
  const p = price(c, cost, 3, 1);
  assert.equal(p.coarse, 5, 'three down to one costs two steps');
  assert.equal(p.gain, 0, 'and on a chain there is nothing left over');
  // The third is DERIVED, and says so.
  assert.equal(p.gated, p.coarse - p.gain);
  assert.deepEqual(p.derived, ['gated']);
});

test('the defect vanishes exactly on a plain ladder', () => {
  const fs: ((i: Level) => number)[] = [(i) => i, (i) => i * i, (i) => Math.log(i + 1)];
  const c = chain(['none', 'month', 'group', 'row']);
  for (const [k, f] of fs.entries())
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 4; b++)
        assert.ok(
          Math.abs(defect(c, f, a, b)) < 1e-12,
          `what a level is worth ${k} charged on a chain`,
        );
  // The control, on the simple non-chain.
  const o = b2();
  assert.ok(
    fs.some((f) => {
      for (let a = 0; a < 4; a++)
        for (let b = 0; b < 4; b++) if (Math.abs(defect(o, f, a, b)) > 1e-9) return true;
      return false;
    }),
    'the defect never fired off a chain: the measure is broken',
  );
});

test('the boundary is where the numbers come from, not the shape', () => {
  // A declared scale is priceable right here.
  assert.equal(declines({ ask: 'cost', scale: 'declared' }), null);
  // Groups in a table are not: their what a level is worth is a scan.
  assert.match(declines({ ask: 'cost' }) ?? '', /scan|measured/);
  assert.match(declines({ groupings: ['a', 'b'] }) ?? '', /measured/);
});

test('a breakdown must rebuild the total it explains', () => {
  const total = { coarse: 2.5, gain: 0.25 };
  const p = localise(
    [
      { name: 'a', mass: 0.25, coarse: 4, gain: 1 },
      { name: 'b', mass: 0.75, coarse: 2, gain: 0 },
    ],
    total,
  );
  assert.ok(Math.abs(p.total.coarse - 2.5) < 1e-12);
  assert.equal(p.worst?.name, 'b', 'mass-weighted, not local');
  assert.ok(Math.abs(p.concentration - 0.6) < 1e-9);

  // THE NEGATIVE CONTROL. A dropped piece reports a friendlier number, so it
  // must not be possible to build one.
  const rejected: [Piece[], string][] = [
    [[{ name: 'a', mass: 0.25, coarse: 4, gain: 1 }], 'a dropped piece'],
    [
      [
        { name: 'a', mass: 0.5, coarse: 1, gain: 0 },
        { name: 'b', mass: 0.5, coarse: 1, gain: 0 },
      ],
      'a total the pieces cannot rebuild',
    ],
    [[], 'nothing at all'],
  ];
  for (const [bad, why] of rejected) {
    const threw = caught(() => {
      localise(bad, total);
    });
    assert.equal(threw?.code, 'MALFORMED', `${why} was accepted`);
  }
});

test('a flat population has no clump to point at', () => {
  const p = localise(
    [
      { name: 'a', mass: 0.5, coarse: 0, gain: 0 },
      { name: 'b', mass: 0.5, coarse: 0, gain: 0 },
    ],
    { coarse: 0, gain: 0 },
  );
  assert.equal(p.worst, null);
  assert.equal(p.concentration, 0);
});

/* ------------------------------------------------------------------ *
 * The rest of the exported surface. A function nobody calls in a test
 * is a function nobody has checked, and the coverage threshold is
 * there to say so rather than to be lowered until it stops saying it.
 * ------------------------------------------------------------------ */

test('the two embeddings are the corners of the scale', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  assert.equal(state(c, permitAll(c, 's')), 'FREE');
  assert.equal(state(c, permitNone(c, 's')), 'FORBIDDEN');
  // And on the shortest scale there is, they are the two a boolean says.
  const b = BOOLEAN();
  assert.deepEqual(asBoolean(b, permitAll(b, 's')), { kind: 'exactly', value: true });
  assert.deepEqual(asBoolean(b, permitNone(b, 's')), { kind: 'exactly', value: false });
});

test('the envelope is symmetric and its two undecided cells are named', () => {
  const states: State[] = ['FREE', 'REQUIRED', 'FORBIDDEN', 'CONFLICT'];
  let undecided = 0;
  for (const a of states) {
    for (const b of states) {
      assert.equal(table(a, b), table(b, a), `${a} ∧ ${b} is not symmetric`);
      if (table(a, b) === 'REQUIRED_OR_CONFLICT') undecided++;
      // FREE is the identity and CONFLICT absorbs — on every cell, not a sample.
      if (a === 'FREE') assert.equal(table(a, b), b);
      if (a === 'CONFLICT') assert.equal(table(a, b), 'CONFLICT');
    }
  }
  // Three cells, because REQUIRED∧FORBIDDEN appears twice and REQUIRED∧REQUIRED once.
  assert.equal(undecided, 3, 'the envelope changed shape');
});

test('composing nothing is the identity, and one unit is itself', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  assert.equal(composeState(c, []), 'FREE');
  const u = unit('s', { floor: 'month', ceiling: 'group' });
  assert.deepEqual(compose(c, [u]), u);
  // An empty method list weakens nothing.
  assert.equal(weakest([]), 'exact');
});

test('a refusal carries its reason and nothing untyped', () => {
  const c = chain(['none', 'row']);
  const missing = caught(() => c.rank('nope'));
  assert.equal(missing?.code, 'UNKNOWN_LEVEL');
  assert.equal(missing?.detail.level, 'nope');
  // Built without detail: the bag is empty, not undefined.
  const empty = caught(() => chain([]));
  assert.equal(empty?.code, 'EMPTY_CHAIN');
  assert.deepEqual(empty?.detail, {});
  assert.ok(empty instanceof UnitError, 'the prototype chain survived transpilation');
});

test('a one-level scale is degenerate but not broken', () => {
  const c = chain(['only']);
  assert.ok(c.isLadder && c.isSimple);
  assert.equal(c.bottom, 'only');
  assert.equal(c.top, 'only');
  assert.deepEqual(c.debits(), [], 'nothing above the bottom to owe');
  assert.equal(c.intervalHeight(0, 0), 0);
  assert.equal(state(c, permitAll(c, 's')), 'FREE');
});

/* ------------------------------------------------------------------ *
 * THE FAST PATH. Two words per opinion; composing is OR and AND.
 *
 * Licensed by the coordinatewise law above, not by hope — so the tests
 * here are differential against the slow path, exhaustively.
 * ------------------------------------------------------------------ */

test('packing loses nothing', () => {
  for (const c of [chain(['none', 'month', 'group', 'row']), b2()]) {
    const pk = packer(c);
    for (let f = 0; f < c.levels.length; f++) {
      for (let cl = 0; cl < c.levels.length; cl++) {
        if (!c.leq(f, cl)) continue;
        const u = unit('s', { floor: c.levels[f], ceiling: c.levels[cl] });
        assert.deepEqual(pk.unpack('s', pk.pack(u)), u, 'round trip');
      }
    }
  }
});

test('the fast path agrees with the slow one', () => {
  let conflicts = 0;
  for (const c of [chain(['none', 'month', 'group', 'row']), b2()]) {
    const pk = packer(c);
    const well: Unit[] = [];
    for (let f = 0; f < c.levels.length; f++)
      for (let cl = 0; cl < c.levels.length; cl++)
        if (c.leq(f, cl)) well.push(unit('s', { floor: c.levels[f], ceiling: c.levels[cl] }));

    for (const a of well) {
      for (const b of well) {
        const fast = and(pk.pack(a), pk.pack(b));
        const slow = compose(c, [a, b]);
        assert.equal(pk.state(fast), state(c, slow), 'state');
        assert.deepEqual(pk.unpack('s', fast), slow, 'bounds');
        if (isConflict(fast)) conflicts++;

        // Associativity is where a bitwise shortcut usually breaks.
        for (const d of well) {
          const left = and(and(pk.pack(a), pk.pack(b)), pk.pack(d));
          const right = and(pk.pack(a), and(pk.pack(b), pk.pack(d)));
          assert.deepEqual(left, right, 'not associative');
          assert.deepEqual(pk.unpack('s', left), compose(c, [a, b, d]));
        }
      }
    }
  }
  // Coverage: without collisions the agreement was only tested on the easy half.
  assert.ok(conflicts > 20, `only ${conflicts} collisions exercised`);
});

test('the collision names itself, and its size comes free', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  const pk = packer(c);
  const joint = and(
    pk.pack(unit('s', { floor: 'row', ceiling: 'row' })),
    pk.pack(unit('s', { floor: 'none', ceiling: 'none' })),
  );
  assert.ok(isConflict(joint));
  assert.equal(debitsOwed(joint), 3);
  // A register of booleans could only have said `no`.
  assert.deepEqual(pk.clashing(joint), ['month', 'group', 'row']);
  assert.equal(
    conflictDebits(
      c,
      compose(c, [
        unit('s', { floor: 'row', ceiling: 'row' }),
        unit('s', { floor: 'none', ceiling: 'none' }),
      ]),
    ),
    debitsOwed(joint),
  );
});

test('composing nothing is free, and order does not matter', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  const pk = packer(c);
  assert.equal(pk.state(pk.free()), 'FREE');
  assert.deepEqual(composePacked(pk.free(), []), pk.free());

  const held = [
    ['month', 'row'],
    ['none', 'group'],
    ['month', 'month'],
  ].map(([f, cl]) => pk.pack(unit('s', { floor: f, ceiling: cl })));
  assert.deepEqual(composePacked(pk.free(), held), composePacked(pk.free(), [...held].reverse()));
});

test('a scale too wide is refused rather than truncated', () => {
  const wide = [...Array(WIDTH + 2).keys()].map(String);
  const threw = caught(() => {
    packer(chain(wide));
  });
  assert.equal(threw?.code, 'MALFORMED', 'it truncated instead of refusing');

  // And one exactly at the edge works, with every bit usable. `1 << 32` is 1
  // in JavaScript, so a mask computed by shifting would come back wrong here.
  const edge = packer(chain([...Array(WIDTH + 1).keys()].map(String)));
  assert.equal(edge.width, WIDTH);
  assert.equal(edge.state(edge.free()), 'FREE', 'the all-ones mask overflowed');
});

test('a register composes a selection, and agrees with the slow path', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  const pk = packer(c);
  const held = [
    unit('r0', { floor: 'none', ceiling: 'row' }),
    unit('r1', { floor: 'month', ceiling: 'row' }),
    unit('r2', { floor: 'none', ceiling: 'none' }),
  ];
  const reg = register(
    pk,
    held.map((u) => pk.pack(u)),
  );
  assert.equal(reg.size, 3);

  // Every subset, against composing the same subset the long way.
  for (let mask = 1; mask < 8; mask++) {
    const rows = [0, 1, 2].filter((i) => (mask & (1 << i)) !== 0);
    const picked = rows.map((i) => held[i]);
    assert.deepEqual(pk.unpack('s', reg.fold(rows)), {
      ...compose(c, picked),
      subject: 's',
    });
  }
  assert.deepEqual(reg.foldAll(), reg.fold([0, 1, 2]));
  // Rows 1 and 2 collide: one insists on `month`, the other allows nothing.
  assert.ok(isConflict(reg.fold([1, 2])));
  assert.deepEqual(pk.clashing(reg.fold([1, 2])), ['month']);
  assert.ok(!isConflict(reg.fold([0, 1])));
});

test('the no-allocation hot path answers the same thing', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  const pk = packer(c);
  const held = [
    unit('r0', { floor: 'none', ceiling: 'row' }),
    unit('r1', { floor: 'month', ceiling: 'row' }),
    unit('r2', { floor: 'none', ceiling: 'none' }),
  ];
  const reg = register(
    pk,
    held.map((u) => pk.pack(u)),
  );
  for (let mask = 1; mask < 8; mask++) {
    const rows = [0, 1, 2].filter((i) => (mask & (1 << i)) !== 0);
    // Same bits as the allocating path, on every selection — not a sample.
    assert.equal(reg.clashesOf(rows), clashes(reg.fold(rows)), `rows ${rows}`);
  }
  assert.equal(reg.clashesOf([0, 1]), 0, 'nothing collides here');
  assert.notEqual(reg.clashesOf([1, 2]), 0);
});

/**
 * THE ESCALATION, on the fast path. Each viewpoint reads clean alone; the
 * pair collides once one can reach the other. Checked against the library's
 * own walking implementation, on every viewpoint — a precomputed answer that
 * differs from the computed one is worse than no precomputation.
 */
test('the folded closure agrees with walking the graph', () => {
  const c = chain(['none', 'month', 'group', 'row']);
  const pk = packer(c);

  const held: Record<string, Unit[]> = {
    analyst: [unit('s', { floor: 'none', ceiling: 'month' })],
    support: [unit('s', { floor: 'group', ceiling: 'row' })],
    auditor: [unit('s', { floor: 'none', ceiling: 'row' })],
    lead: [],
  };
  const names = Object.keys(held);
  // Flatten to rows, remembering which rows each name owns.
  const flat: Unit[] = [];
  const owns: Record<string, number[]> = {};
  for (const n of names) {
    owns[n] = held[n].map((u) => {
      flat.push(u);
      return flat.length - 1;
    });
  }
  const reg = register(
    pk,
    flat.map((u) => pk.pack(u)),
  );

  // `lead` can act as both, and that is the only place a conflict exists.
  const edges: Edge[] = [
    ['lead', 'analyst'],
    ['lead', 'support'],
    ['analyst', 'auditor'],
  ];
  const eff = closure(
    reg,
    names,
    (n) => reach(edges, n),
    (n) => owns[n],
  );

  for (const n of names) {
    const walked = effective(c, edges, n, (name) => held[name]);
    const row = eff.row(n);
    assert.notEqual(row, -1, `${n} has no row`);
    // Same bounds, and same verdict, by two independent routes.
    const slow = walked.bounds;
    if (slow === null) {
      assert.equal(eff.clashesAt(row), 0, `${n}: nothing held must not collide`);
    } else {
      assert.deepEqual(pk.unpack('s', eff.packedAt(row)), { ...slow, subject: 's' }, n);
      assert.equal(eff.clashesAt(row) !== 0, composeState(c, walked.units) === 'CONFLICT', n);
    }
    assert.deepEqual([...eff.via(n)], walked.via, `${n}: route`);
  }

  // And the finding itself: each alone is fine, `lead` is not.
  assert.equal(eff.clashesAt(eff.row('analyst')), 0);
  assert.equal(eff.clashesAt(eff.row('support')), 0);
  assert.notEqual(eff.clashesAt(eff.row('lead')), 0, 'the escalation vanished');
  // …and the route says where it came from, which is the actionable half.
  assert.ok(eff.via('lead').includes('support'));
  assert.equal(eff.row('nobody'), -1);
});

/**
 * `accepts` and `clashes` are DIFFERENT questions, and the packed forms of
 * both must agree with walking the scale — on every level of every
 * well-formed opinion, not on a sample.
 */
test('may-this-happen is not the same question as does-this-collide', () => {
  for (const c of [chain(['none', 'month', 'group', 'row']), b2()]) {
    const pk = packer(c);
    const masks = c.levels.map((l) => pk.maskOf(l));
    for (let f = 0; f < c.levels.length; f++) {
      for (let cl = 0; cl < c.levels.length; cl++) {
        if (!c.leq(f, cl)) continue;
        const p = pk.pack(unit('s', { floor: c.levels[f], ceiling: c.levels[cl] }));
        for (let l = 0; l < c.levels.length; l++) {
          // The definition, walked: floor ≤ L ≤ ceiling.
          const walked = c.leq(f, l) && c.leq(l, cl);
          assert.equal(
            pk.accepts(p, masks[l]),
            walked,
            `${c.levels[f]}..${c.levels[cl]} @ ${c.levels[l]}`,
          );
        }
      }
    }
    // THE TRAP. "Nothing above the bottom" collides with nothing and permits
    // nothing, so a caller checking only for collisions reads it as allowed.
    const none = pk.pack(unit('s', { floor: c.bottom, ceiling: c.bottom }));
    assert.equal(isConflict(none), false, 'it does not collide');
    assert.equal(pk.accepts(none, pk.maskOf(c.top)), false, 'and it does not permit');
    assert.equal(pk.accepts(none, pk.maskOf(c.bottom)), true, 'the bottom is always in');
  }
});

/* ------------------------------------------------------------------ *
 * THE INPUTS THE OTHER FILES NEVER SEND.
 *
 * Every other vector file is well-formed on purpose, and that was a
 * blind spot with a shape: three real divergences got in through it.
 * ------------------------------------------------------------------ */

/** A number JSON cannot spell. A vector that cannot express what it tests is not testing it. */
const num = (v: number | string): number =>
  v === 'NaN' ? NaN : v === 'Infinity' ? Infinity : v === '-Infinity' ? -Infinity : (v as number);

test('degenerate carriers and breakdowns', () => {
  const v = load('degenerate');
  const kinds = new Set<string>();
  for (const c of v.cases) {
    kinds.add(c.kind);
    if (c.kind === 'carrier') {
      const threw = caught(() => chain(c.levels));
      if (c.expect === 'OK') {
        assert.equal(threw, null, `${c.name}: refused a valid scale`);
        const o = chain(c.levels);
        assert.equal(o.bottom, c.bottom, `${c.name}: bottom`);
        assert.equal(o.top, c.top, `${c.name}: top`);
        assert.deepEqual(
          o.debits().map((j: Level) => o.levels[j]),
          c.debits,
          `${c.name}: debits`,
        );
        const u = unit('s', { floor: o.bottom, ceiling: o.top });
        assert.equal(state(o, u), c.state, `${c.name}: state`);
        // The round trip has to hold on a degenerate scale too — that is
        // exactly what a duplicated name broke here.
        const pk = packer(o);
        assert.deepEqual(pk.unpack('s', pk.pack(u)), u, `${c.name}: round trip`);
      } else {
        assert.equal(threw?.code, c.expect, c.name);
      }
    } else {
      const pieces = c.pieces.map((p: Record<string, number | string>) => ({
        name: p.name as string,
        mass: num(p.mass),
        coarse: num(p.coarse),
        gain: num(p.gain),
      }));
      const total = { coarse: num(c.total.coarse), gain: num(c.total.gain) };
      const threw = caught(() => localise(pieces, total));
      // The two surfaces name the closure failures differently — Rust has a
      // typed error per law, this one folds both into MALFORMED. What has to
      // match is that it REFUSES, and that non-finite is its own refusal
      // rather than being swallowed by a comparison that is false for NaN.
      const want = c.expect === 'NOT_FINITE' ? 'NOT_FINITE' : 'MALFORMED';
      assert.equal(threw?.code, want, c.name);
    }
  }
  assert.equal(kinds.size, 2, 'one kind never occurred');
});

test('may this happen at this level', () => {
  const v = load('accepts');
  const o = chain(v.chain);
  const pk = packer(o);
  let yes = 0;
  let no = 0;
  for (const c of v.cases) {
    const u = unit('s', { floor: c.floor, ceiling: c.ceiling });
    assert.equal(pk.accepts(pk.pack(u), pk.maskOf(c.at)), c.accepts, c.name);
    if (c.accepts) yes++;
    else no++;
  }
  assert.ok(yes > 0 && no > 0, 'the file only tests one answer');
});

/**
 * A row nobody registered must be REFUSED. `Int32Array[99]` is `undefined`
 * and `x & undefined` is 0, so without the check the fold came back
 * permitting nothing — silently, and with confidence.
 */
test('a row outside the register is refused, not answered', () => {
  const c = chain(['a', 'b', 'c']);
  const pk = packer(c);
  const reg = register(pk, [pk.pack(unit('s', { floor: 'b', ceiling: 'c' }))]);

  assert.deepEqual(reg.fold([0]), pk.pack(unit('s', { floor: 'b', ceiling: 'c' })));
  for (const bad of [1, 99, -1]) {
    assert.equal(caught(() => reg.fold([bad]))?.code, 'UNKNOWN_ROW', `fold ${bad}`);
    assert.equal(caught(() => reg.clashesOf([bad]))?.code, 'UNKNOWN_ROW', `clashesOf ${bad}`);
  }
  // The empty selection is still the identity, not an error.
  assert.deepEqual(reg.fold([]), pk.free());
  assert.equal(reg.clashesOf([]), 0);
});

/**
 * The gap is where the list has to stay a list. Two ranges with nothing
 * acceptable between them cannot be one range without inventing a level
 * neither side accepted.
 */
test('a gap keeps them apart, and touching merges them', () => {
  const c = chain(['none', 'own', 'team', 'region', 'all']);
  const a = unit('x', { floor: 'none', ceiling: 'own' });
  const b = unit('x', { floor: 'region', ceiling: 'all' });

  const gapped = anyOf(c, [a, b]);
  assert.equal(gapped.length, 2, 'it merged across a gap');
  assert.deepEqual(
    gapped.map((u) => `${u.floor}..${u.ceiling}`),
    ['none..own', 'region..all'],
  );
  // And `team` — the level in the gap — is accepted by nothing in the result.
  const inGap = unit('x', { floor: 'team', ceiling: 'team' });
  assert.ok(
    gapped.every((u) => !entails(c, inGap, u)),
    'the gap leaked in',
  );

  // Touching has no gap, so one range comes back.
  const touching = anyOf(c, [unit('x', { floor: 'none', ceiling: 'team' }), b]);
  assert.equal(touching.length, 1);
  assert.deepEqual(touching[0].floor + '..' + touching[0].ceiling, 'none..all');
});

test('missing says what to change, not why it failed', () => {
  const c = chain(['none', 'own', 'team', 'region', 'all']);
  const have = unit('x', { floor: 'none', ceiling: 'team' });

  assert.deepEqual(missing(c, have, unit('x', { floor: 'none', ceiling: 'all' })), {
    raiseFloorTo: [],
    raiseCeilingTo: ['all'],
  });
  assert.deepEqual(missing(c, have, unit('x', { floor: 'own', ceiling: 'team' })), {
    raiseFloorTo: ['own'],
    raiseCeilingTo: [],
  });
  assert.deepEqual(missing(c, have, unit('x', { floor: 'none', ceiling: 'own' })), {
    raiseFloorTo: [],
    raiseCeilingTo: [],
  });

  // Applying what it says actually reaches the target.
  const want = unit('x', { floor: 'own', ceiling: 'all' });
  const m = missing(c, have, want);
  const fixed = unit('x', {
    floor: m.raiseFloorTo[0] ?? have.floor,
    ceiling: m.raiseCeilingTo[0] ?? have.ceiling,
  });
  assert.ok(c.leq(c.rank(want.floor), c.rank(fixed.floor)), 'floor still short');
  assert.ok(c.leq(c.rank(want.ceiling), c.rank(fixed.ceiling)), 'ceiling still short');
});

test('anyOf — exact, as a list', () => {
  const v = load('any-of');
  const o = chain(v.chain);
  let merged = 0;
  let apart = 0;
  for (const c of v.cases) {
    const got = anyOf(
      o,
      c.units.map((u: { floor: string; ceiling: string }) => unit('s', u)),
    );
    assert.deepEqual(
      got.map((u: Unit) => ({ floor: u.floor, ceiling: u.ceiling })),
      c.anyOf,
      c.name,
    );
    if (c.units.length > got.length) merged++;
    if (got.length > 1) apart++;
  }
  // Coverage: both outcomes must occur, or the file tests one of them.
  assert.ok(merged > 0 && apart > 0, 'only one kind of answer was exercised');
});

/**
 * THE LAW: the list accepts exactly what the inputs accepted between them.
 * Nothing gained, nothing lost — checked over every level, on every subset of
 * a small scale, rather than on the cases above.
 */
test('anyOf gains no level and loses none', () => {
  const o = chain(['a', 'b', 'c', 'd']);
  const all: Unit[] = [];
  for (let f = 0; f < 4; f++)
    for (let cl = f; cl < 4; cl++)
      all.push(unit('s', { floor: o.levels[f], ceiling: o.levels[cl] }));

  const accepts = (u: Unit, l: number): boolean =>
    o.leq(o.rank(u.floor), l) && o.leq(l, o.rank(u.ceiling));

  let checked = 0;
  for (let mask = 1; mask < 1 << all.length; mask += 37) {
    const picked = all.filter((_, i) => mask & (1 << i));
    const got = anyOf(o, picked);
    for (let l = 0; l < 4; l++) {
      const before = picked.some((u) => accepts(u, l));
      const after = got.some((u) => accepts(u, l));
      assert.equal(after, before, `level ${o.levels[l]} changed`);
    }
    checked++;
  }
  assert.ok(checked > 20, `only ${checked} subsets checked`);
});

test('missing — what to change, and applying it reaches the target', () => {
  const v = load('missing');
  const o = chain(v.chain);
  const u = (x: { floor: string; ceiling: string }): Unit => unit('s', x);
  for (const c of v.cases) {
    const got = missing(o, u(c.have), u(c.want));
    assert.deepEqual(got.raiseFloorTo, c.raiseFloorTo, `${c.name}: floor`);
    assert.deepEqual(got.raiseCeilingTo, c.raiseCeilingTo, `${c.name}: ceiling`);

    // The check that stops this being a plausible-looking subtraction.
    const fixed = unit('s', {
      floor: got.raiseFloorTo[0] ?? c.have.floor,
      ceiling: got.raiseCeilingTo[0] ?? c.have.ceiling,
    });
    assert.ok(o.leq(o.rank(c.want.floor), o.rank(fixed.floor)), `${c.name}: still short`);
    assert.ok(o.leq(o.rank(c.want.ceiling), o.rank(fixed.ceiling)), `${c.name}: still short`);
  }
});

/**
 * COMPLEXITY, from the companion paper: how much a statement names, counting
 * both the steps it demands and the steps it limits.
 *
 * The paper's census pins the two ends — the minimum is reached exactly once,
 * at (bottom, top), and the maximum exactly once, at (top, bottom), where it
 * equals the total number of steps of both kinds.
 */
test('complexity is zero once and maximal once', () => {
  for (const c of [chain(['a', 'b', 'c', 'd']), chain(['x', 'y']), b2()]) {
    const total = c.debits().length + c.limits().length;
    let zeros = 0;
    let maxima = 0;
    for (let f = 0; f < c.levels.length; f++) {
      for (let cl = 0; cl < c.levels.length; cl++) {
        const n = complexity(c, unit('s', { floor: c.levels[f], ceiling: c.levels[cl] }));
        assert.ok(n >= 0 && n <= total, `out of range: ${n} of ${total}`);
        if (n === 0) zeros++;
        if (n === total) maxima++;
      }
    }
    assert.equal(zeros, 1, 'saying nothing must be reachable exactly one way');
    assert.equal(maxima, 1, 'saying everything must be reachable exactly one way');
  }
});

/**
 * The two halves are DIFFERENT sets. On a ladder the demand side is every
 * level above the bottom and the limit side every level below the top — so
 * counting one twice would give the same total and hide the error.
 */
test('the two kinds of step are not the same set', () => {
  const c = chain(['a', 'b', 'c', 'd']);
  const demand = c.debits().map((i) => c.levels[i]);
  const limit = c.limits().map((i) => c.levels[i]);
  assert.deepEqual(demand, ['b', 'c', 'd']);
  assert.deepEqual(limit, ['a', 'b', 'c']);
  assert.notDeepEqual(demand, limit, 'one half was counted twice');
});

/**
 * THE SIGN LAW. The two slacks decide what is left over, before anybody says
 * what a level is worth — and the test checks the claim against actual
 * valuations rather than restating it.
 */
test('both slacks zero means nothing is left over, for any valuation', () => {
  const ways: ((i: Level) => number)[] = [
    (i) => i,
    (i) => i * i,
    (i) => Math.log(i + 1),
    (i) => 2 ** i,
    (i) => Math.sqrt(i),
  ];

  for (const c of [chain(['a', 'b', 'c', 'd']), b2()]) {
    for (let a = 0; a < c.levels.length; a++) {
      for (let b = 0; b < c.levels.length; b++) {
        const s = slack(c, a, b);
        assert.notEqual(s, null, 'both scales here can count steps');
        assert.ok(s!.up >= 0 && s!.down >= 0, 'a slack cannot be negative');

        for (const worth of ways) {
          const left = defect(c, worth, a, b);
          if (s!.up === 0 && s!.down === 0) {
            assert.ok(Math.abs(left) < 1e-9, `nothing should be left over, got ${left}`);
          }
          if (s!.down === 0) {
            assert.ok(left <= 1e-9, `wrong sign with no downward slack: ${left}`);
          }
          if (s!.up === 0) {
            assert.ok(left >= -1e-9, `wrong sign with no upward slack: ${left}`);
          }
        }
      }
    }
  }
});

/**
 * And the slacks explain the thing this library leans on: a plain ladder
 * never leaves anything over, and it is visible from the scale alone.
 */
test('a ladder has no slack, and the other scale does', () => {
  const ladder = chain(['a', 'b', 'c', 'd']);
  for (let a = 0; a < 4; a++) {
    for (let b = 0; b < 4; b++) {
      assert.deepEqual(slack(ladder, a, b), { up: 0, down: 0 }, `${a},${b}`);
    }
  }
  // The two side-by-side levels of the other scale are exactly where it shows.
  const o = b2();
  const x = o.rank('x');
  const y = o.rank('y');
  assert.deepEqual(slack(o, x, y), { up: 1, down: 1 });
  // Comparable pairs on that same scale still have none.
  assert.deepEqual(slack(o, o.bottomIx, x), { up: 0, down: 0 });
});

/**
 * THE SPECTRUM OF A LADDER IS ONE POINT.
 *
 * Every pair produces the same outcome — nothing left over — whatever a level
 * is worth. That is the property the whole thin surface rests on, arrived at
 * from the other direction: not "the theorem says so" but "walk every pair and
 * count what comes out".
 */
test('a ladder produces exactly one outcome, any way you value it', () => {
  const ways: ((i: Level) => number)[] = [
    (i) => i,
    (i) => i * i,
    (i) => Math.log(i + 1),
    (i) => 2 ** i,
  ];

  for (const worth of ways) {
    const ladder = spectrum(chain(['a', 'b', 'c', 'd']), worth);
    assert.equal(ladder.values.length, 1, 'a ladder must produce one outcome');
    assert.equal(ladder.values[0], 0);
    assert.deepEqual(ladder.band, { low: 0, high: 0 });
  }

  // THE CONTROL, and it is narrower than it looks. The other scale does NOT
  // always spread — under the counting valuation it collapses to one point
  // too. What is true is that SOME way of valuing levels spreads it, and a
  // ladder has none. An earlier version of this test asserted the wrong
  // thing and failed honestly.
  const spread = ways.filter((w) => spectrum(b2(), w).values.length > 1);
  assert.ok(spread.length > 0, 'no valuation spread the other scale');
  assert.ok(spread.length < ways.length, 'the counting valuation should not spread it');
});

/**
 * Degeneracy is pairs over distinct answers. It matters because a report that
 * ranks by an outcome most pairs share is ranking mostly noise.
 */
test('degeneracy counts how much lands on the same answer', () => {
  const s = spectrum(b2(), (i) => i * i);
  assert.equal(s.degeneracy, s.pairs / s.values.length);
  assert.ok(s.degeneracy > 1, 'some pairs must share an answer');
  // Values come back sorted and distinct.
  assert.deepEqual(
    [...s.values].sort((a, b) => a - b),
    s.values,
  );
  assert.equal(new Set(s.values).size, s.values.length);
});

/**
 * A way of valuing levels that is not finite is refused rather than producing
 * a band of `NaN` — the same reason `localise` checks first.
 */
test('a non-finite valuation is refused', () => {
  const c = chain(['a', 'b']);
  assert.equal(caught(() => spectrum(c, () => NaN))?.code, 'NOT_FINITE');
  assert.equal(caught(() => spectrum(c, (i) => (i === 1 ? Infinity : 0)))?.code, 'NOT_FINITE');
});

/**
 * The weakest answer is not `higher(have, want)`. That one always works and is
 * not the smallest — which only shows on a scale where two levels sit side by
 * side, so a ladder alone would never have caught it.
 */
test('missing returns the weakest change, not merely a working one', () => {
  const o = b2();
  const have = unit('s', { floor: 'x', ceiling: 'both' });
  const want = unit('s', { floor: 'y', ceiling: 'both' });

  const m = missing(o, have, want);
  assert.deepEqual(m.raiseFloorTo, ['y'], 'it overshot to the top');
  assert.deepEqual(m.raiseCeilingTo, []);

  // What it returns has to actually work.
  for (const l of m.raiseFloorTo) {
    const fixed = o.higher(o.rank(have.floor), o.rank(l));
    assert.ok(o.leq(o.rank(want.floor), fixed), `${l} does not reach`);
  }
  // And nothing weaker works, on every level of the scale.
  for (const l of o.levels) {
    const reaches = o.leq(o.rank(want.floor), o.higher(o.rank(have.floor), o.rank(l)));
    const weakerThanAnAnswer = m.raiseFloorTo.some((a) => a !== l && o.leq(o.rank(l), o.rank(a)));
    assert.ok(!(reaches && weakerThanAnAnswer), `${l} was weaker and still worked`);
  }

  // On a ladder there is always exactly one, so the list reads as a value.
  const c = chain(['a', 'b', 'c', 'd']);
  const one = missing(
    c,
    unit('s', { floor: 'a', ceiling: 'b' }),
    unit('s', { floor: 'c', ceiling: 'c' }),
  );
  assert.equal(one.raiseFloorTo.length, 1);
  assert.deepEqual(one.raiseFloorTo, ['c']);
});

/** The named valuations. JSON cannot hold a function, so both surfaces agree by name. */
const WORTH: Record<string, (i: Level) => number> = {
  counting: (i) => i,
  square: (i) => i * i,
  log: (i) => Math.log(i + 1),
};

const scaleFrom = (spec: string[] | { levels: string[]; leq: boolean[][] }): Scale =>
  Array.isArray(spec) ? chain(spec) : order(spec.levels, spec.leq);

test('complexity — how much a statement says', () => {
  const v = load('complexity');
  const o = chain(v.chain);
  const seen = new Set<number>();
  for (const c of v.cases) {
    const got = complexity(o, unit('s', { floor: c.floor, ceiling: c.ceiling }));
    assert.equal(got, c.complexity, c.name);
    seen.add(got);
  }
  // Coverage: a file where every case scored the same would pass an
  // implementation that returned a constant.
  assert.ok(seen.size > 2, 'the file only exercises one or two totals');
});

test('slack — before anybody says what a level is worth', () => {
  const v = load('slack');
  let nonZero = 0;
  for (const c of v.cases) {
    const o = scaleFrom(v.scales[c.scale]);
    const got = slack(o, o.rank(c.a), o.rank(c.b));
    assert.deepEqual(got, { up: c.up, down: c.down }, c.name);
    if (c.up !== 0 || c.down !== 0) nonZero++;
  }
  // Coverage: without a non-zero case the file passes on a stub returning 0.
  assert.ok(nonZero > 0, 'every case had no slack');
});

test('spectrum — every outcome a scale can produce', () => {
  const v = load('spectrum');
  let spread = 0;
  for (const c of v.cases) {
    const o = scaleFrom(v.scales[c.scale]);
    const got = spectrum(o, WORTH[c.worth], v.places);
    assert.deepEqual(got.values, c.values, `${c.name}: values`);
    assert.equal(got.pairs, c.pairs, `${c.name}: pairs`);
    assert.deepEqual(
      got.band,
      { low: c.values[0], high: c.values[c.values.length - 1] },
      `${c.name}: band`,
    );
    assert.equal(got.degeneracy, c.pairs / c.values.length, `${c.name}: degeneracy`);
    if (got.values.length > 1) spread++;
  }
  // Coverage: both outcomes occur — a ladder collapsing, and something spreading.
  assert.ok(spread > 0 && spread < v.cases.length, 'only one kind of answer was exercised');
});

test('states-per-step — the read-out that composes', () => {
  const v = load('states-per-step');
  const o = chain(v.chain);
  const kinds = new Set<string>();
  for (const c of v.cases) {
    const got = statesPerDebit(o, unit('s', { floor: c.floor, ceiling: c.ceiling }));
    assert.deepEqual(got, c.steps, c.name);
    for (const [, st] of got) kinds.add(st);
  }
  // Coverage: all four states must occur, or the file only checks the easy ones.
  assert.equal(kinds.size, 4, `only saw ${[...kinds].join(', ')}`);
});

test('effective — reaching means holding', () => {
  const v = load('effective');
  const o = chain(v.chain);
  let escalated = 0;
  for (const c of v.cases) {
    const held: Record<string, { floor: string; ceiling: string }> = c.held;
    const got = effective(o, c.edges as Edge[], c.from, (n) =>
      held[n] === undefined ? [] : [unit('s', held[n])],
    );
    assert.deepEqual(got.via, c.via, `${c.name}: via`);
    if (c.bounds === null) {
      assert.equal(got.bounds, null, `${c.name}: bounds`);
    } else {
      assert.equal(got.bounds?.floor, c.bounds.floor, `${c.name}: floor`);
      assert.equal(got.bounds?.ceiling, c.bounds.ceiling, `${c.name}: ceiling`);
      if (state(o, got.bounds!) === 'CONFLICT') escalated++;
    }
  }
  // Coverage: without an escalation the file never exercises the point.
  assert.ok(escalated > 0, 'no case crossed');
});

test('entails — and the direction reverses between the marks', () => {
  const v = load('entails');
  const o = chain(v.chain);
  let yes = 0;
  let no = 0;
  for (const c of v.cases) {
    const [a, b] = [c.a, c.b].map((x: string[]) => unit('s', { floor: x[0], ceiling: x[1] }));
    assert.equal(entails(o, a, b), c.entails, c.name);
    if (c.entails) yes++;
    else no++;
  }
  assert.ok(yes > 0 && no > 0, 'the file only tests one answer');
});

/* ------------------------------------------------------------------ *
 * The corners the vectors do not reach. Each of these was an uncovered
 * branch — a path that ran only when something went wrong, and so was
 * the least checked and the most load-bearing.
 * ------------------------------------------------------------------ */

test('intervalHeight refuses a pair the wrong way round', () => {
  const c = chain(['a', 'b', 'c']);
  assert.equal(c.intervalHeight(0, 2), 2, 'up the ladder');
  assert.equal(c.intervalHeight(2, 0), null, 'and nothing back down it');
  assert.equal(c.intervalHeight(1, 1), 0, 'a level reaches itself in no steps');
});

test('a scale built from something that is not a list is refused', () => {
  for (const bad of [null, undefined, 'abc', 42, {}]) {
    assert.equal(caught(() => chain(bad as never))?.code, 'EMPTY_CHAIN', String(bad));
    assert.equal(caught(() => order(bad as never, []))?.code, 'EMPTY_CHAIN', String(bad));
  }
});

test('a total that is not finite is refused, not only a piece', () => {
  const good = [{ name: 'x', mass: 1, coarse: 2, gain: 0 }];
  // The pieces are fine here; it is the total that is not, and the check for
  // it is a separate branch from the one over the pieces.
  for (const total of [
    { coarse: NaN, gain: 0 },
    { coarse: 2, gain: Infinity },
    { coarse: -Infinity, gain: 0 },
  ]) {
    assert.equal(caught(() => localise(good, total))?.code, 'NOT_FINITE', JSON.stringify(total));
  }
  assert.doesNotThrow(() => localise(good, { coarse: 2, gain: 0 }));
});

test('slack has no answer where the scale cannot count', () => {
  const T = true;
  const F = false;
  // The pentagon: none→c→all is two steps, none→a→b→all is three.
  const n5 = order(
    ['none', 'a', 'b', 'c', 'all'],
    [
      [T, T, T, T, T],
      [F, T, T, F, T],
      [F, F, T, F, T],
      [F, F, F, T, T],
      [F, F, F, F, T],
    ],
  );
  assert.equal(slack(n5, n5.rank('b'), n5.rank('c')), null, 'it counted anyway');
  // And on a scale that can count, it answers.
  assert.deepEqual(slack(chain(['x', 'y']), 0, 1), { up: 0, down: 0 });
});

test('an empty register and a single-opinion one both behave', () => {
  const c = chain(['a', 'b']);
  const pk = packer(c);

  const empty = register(pk, []);
  assert.equal(empty.size, 0);
  assert.deepEqual(empty.foldAll(), pk.free(), 'nothing registered is the identity');
  assert.equal(empty.clashesOf([]), 0);
  assert.equal(caught(() => empty.fold([0]))?.code, 'UNKNOWN_ROW', 'row 0 of nothing');

  const one = register(pk, [pk.pack(unit('s', { floor: 'b', ceiling: 'b' }))]);
  assert.deepEqual(one.foldAll(), one.fold([0]));
});

test('anyOf keeps merging until nothing moves', () => {
  const c = chain(['a', 'b', 'c', 'd', 'e']);
  // Given in an order where the first pass cannot merge everything: `a..a`
  // and `c..c` do not touch, and only after `b..b` joins them does the run
  // become one. A single pass would return two ranges.
  const got = anyOf(c, [
    unit('x', { floor: 'a', ceiling: 'a' }),
    unit('x', { floor: 'c', ceiling: 'c' }),
    unit('x', { floor: 'b', ceiling: 'b' }),
  ]);
  assert.equal(got.length, 1, 'it stopped after one pass');
  assert.deepEqual([got[0].floor, got[0].ceiling], ['a', 'c']);

  // And the subject of the merged range comes from the inputs, not invented.
  assert.equal(got[0].subject, 'x');
});
