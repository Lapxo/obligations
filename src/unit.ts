import { UnitError } from './errors';
import type { BoolView, Level, Outcome, Scale, State, Unit } from './types';

/** One opinion about one subject: the levels it finds acceptable. */
export function unit(subject: string, bounds: { floor: string; ceiling: string }): Unit {
  return { subject, floor: bounds.floor, ceiling: bounds.ceiling };
}

/** The embedding — just not the interesting direction. */
export const permitAll = (c: Scale, subject: string): Unit =>
  unit(subject, { floor: c.bottom, ceiling: c.top });

export const permitNone = (c: Scale, subject: string): Unit =>
  unit(subject, { floor: c.bottom, ceiling: c.bottom });

export function state(c: Scale, u: Unit): State {
  return c.stateOf(c.rank(u.floor), c.rank(u.ceiling));
}

/**
 * Read a unit as a boolean, and say what that costs.
 *
 * Faithful in exactly two places: "everything is acceptable" and "only the
 * bottom is". Everywhere else a boolean either drops the grain or cannot
 * speak at all — and every drop is named, because a projection that loses
 * silently is the whole problem being fixed.
 */
export function asBoolean(c: Scale, u: Unit): BoolView {
  const s = state(c, u);
  if (s === 'CONFLICT') {
    return {
      kind: 'unsayable',
      lost:
        'a boolean has no way to say two promises cannot both hold, so a ' +
        'register of booleans settles it by precedence instead',
    };
  }
  if (s === 'REQUIRED') {
    return {
      kind: 'lossy',
      value: true,
      lost:
        'the floor: a boolean says may, never must, so nothing records that ' +
        'somebody depends on this',
    };
  }
  if (s === 'FORBIDDEN') {
    return c.rank(u.ceiling) === c.bottomIx
      ? { kind: 'exactly', value: false }
      : { kind: 'lossy', value: true, lost: 'the ceiling: a boolean cannot say how far' };
  }
  return { kind: 'exactly', value: true };
}

/**
 * Compose opinions about one subject: the highest demand and the lowest
 * limit.
 *
 * A crossed result is an ANSWER — the collision — and is returned. A unit
 * that was already impossible on its own is an ERROR: nothing collided, one
 * promise was written wrong, and calling that a collision hides the typo.
 */
export function compose(c: Scale, units: readonly Unit[]): Unit {
  if (units.length === 0) return permitAll(c, '');
  let floor = c.bottomIx;
  let ceiling = c.topIx;
  for (const u of units) {
    const f = c.rank(u.floor);
    const cl = c.rank(u.ceiling);
    if (!c.leq(f, cl)) {
      throw new UnitError('MALFORMED', `\`${u.subject}\` cannot be met by anything`, {
        subject: u.subject,
        floor: u.floor,
        ceiling: u.ceiling,
      });
    }
    floor = c.higher(floor, f);
    ceiling = c.lower(ceiling, cl);
  }
  return { subject: units[0].subject, floor: c.levels[floor], ceiling: c.levels[ceiling] };
}

export function composeState(c: Scale, units: readonly Unit[]): State {
  const u = compose(c, units);
  return c.stateOf(c.rank(u.floor), c.rank(u.ceiling));
}

const ORDER: readonly State[] = ['FREE', 'REQUIRED', 'FORBIDDEN', 'CONFLICT'];
const RoC = 'REQUIRED_OR_CONFLICT' as const;

/**
 * The sixteen: what composing two states can produce.
 *
 * A soundness envelope, NOT the engine. Two cells are genuinely undecided by
 * the states alone — `REQUIRED ∧ REQUIRED` and `REQUIRED ∧ FORBIDDEN` each
 * give `REQUIRED` or `CONFLICT` depending on where the levels fall — so a
 * 4×4 table cannot be the composition. `compose` works on the bounds and is
 * exact; this says what the answer is allowed to be.
 */
const TABLE: readonly (readonly Outcome[])[] = [
  ['FREE', 'REQUIRED', 'FORBIDDEN', 'CONFLICT'],
  ['REQUIRED', RoC, RoC, 'CONFLICT'],
  ['FORBIDDEN', RoC, 'FORBIDDEN', 'CONFLICT'],
  ['CONFLICT', 'CONFLICT', 'CONFLICT', 'CONFLICT'],
];

export function table(a: State, b: State): Outcome {
  return TABLE[ORDER.indexOf(a)][ORDER.indexOf(b)];
}

/**
 * How many debits a collision consumes.
 *
 * Without it a collision has no size — a promise missed by one level and one
 * missed by three are the same word, and the first is usually a mistake
 * while the second is usually a disagreement.
 *
 * It is a HEIGHT, not a subtraction, and it throws where the scale cannot
 * count one. It is also the price under the counting what a level is worth: put
 * `f = height` into `dropTo` and the same number comes back, which is why
 * "how big" and "what does it cost" are one question and not two.
 */
export function conflictDebits(c: Scale, u: Unit): number {
  const f = c.rank(u.floor);
  const cl = c.rank(u.ceiling);
  if (c.leq(f, cl)) return 0;
  const top = c.higher(f, cl);
  const h = c.intervalHeight(cl, top);
  if (h === null) {
    throw new UnitError(
      'NOT_GRADED',
      `between \`${c.levels[cl]}\` and \`${c.levels[top]}\` this order has ` +
        'maximal chains of different lengths, so the collision has no size',
      { from: c.levels[cl], to: c.levels[top] },
    );
  }
  return h;
}

/**
 * `a ⊨ b` — everything satisfying `a` satisfies `b`. The product order:
 * `b`'s demand under `a`'s, `a`'s limit under `b`'s. Two comparisons, no
 * search.
 */
export function entails(c: Scale, a: Unit, b: Unit): boolean {
  const [af, ac] = [c.rank(a.floor), c.rank(a.ceiling)];
  const [bf, bc] = [c.rank(b.floor), c.rank(b.ceiling)];
  // Nothing satisfies an impossible promise, so it entails everything.
  return !c.leq(af, ac) || (c.leq(bf, af) && c.leq(ac, bc));
}

/**
 * The state of every debit under a unit — the exact read-out.
 *
 * A single label per unit cannot compose exactly, and ADDING labels makes it
 * worse: a five-label summary has seven undecided cells instead of three.
 * The ambiguity is the level-dependence itself; no relabelling removes it.
 *
 * This one does compose. Each debit carries (is it demanded?, is it
 * permitted?) — two booleans, not one with four values — and they compose
 * one step at a time: demand by OR because the floor takes the highest, limit by AND
 * because the ceiling takes the lowest.
 */
export function statesPerDebit(c: Scale, u: Unit): [string, State][] {
  const f = c.rank(u.floor);
  const cl = c.rank(u.ceiling);
  return c.debits().map((j: Level): [string, State] => {
    const demanded = c.leq(j, f);
    const permitted = c.leq(j, cl);
    return [
      c.levels[j],
      demanded ? (permitted ? 'REQUIRED' : 'CONFLICT') : permitted ? 'FREE' : 'FORBIDDEN',
    ];
  });
}

/**
 * ANY of these — exactly, as a list.
 *
 * Combining says "all of them must hold" and lands on one range. "Any of them
 * may hold" does not: two ranges with a gap between them are not one range.
 *
 * So the answer is a LIST. Ranges that can be merged without picking up a
 * level neither of them accepted are merged; the rest stay apart. Nothing is
 * approximated and nothing is over-covered.
 *
 * ```text
 *          none    own    team   region   all
 *   a      ●━━━━━━━━●
 *   b      ················●━━━━━━━━━●
 *   anyOf  ●━━━━━━━━●      ●━━━━━━━━━●        two ranges, exactly
 *
 *   a      ●━━━━━━━━━━━━━━━━●
 *   b      ················●━━━━━━━━━●
 *   anyOf  ●━━━━━━━━━━━━━━━━━━━━━━━━━●        they touch, so one
 * ```
 *
 * A single range back means the alternatives really were one. More than one
 * means they are genuinely separate, and the list says where the gaps are.
 *
 * Unsatisfiable inputs are dropped: nothing satisfies them, so they add
 * nothing to "any of these". An empty result means none of the alternatives
 * can be met at all.
 *
 * The order is deterministic — by floor, then by ceiling — so two
 * implementations return the same list.
 */
export function anyOf(c: Scale, units: readonly Unit[]): Unit[] {
  const rank = (u: Unit): [Level, Level] => [c.rank(u.floor), c.rank(u.ceiling)];
  const holds = (f: Level, cl: Level, l: Level): boolean => c.leq(f, l) && c.leq(l, cl);
  const levels = [...c.levels.keys()];

  // Nothing satisfies a crossed range, so it contributes nothing.
  let live = units.filter((u) => {
    const [f, cl] = rank(u);
    return c.leq(f, cl);
  });

  // Merge while any pair can be merged without gaining a level neither side
  // accepted. Repeated because merging can unlock a further merge.
  for (let changed = true; changed;) {
    changed = false;
    outer: for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const [af, ac] = rank(live[i]);
        const [bf, bc] = rank(live[j]);
        const lo = c.lower(af, bf);
        const hi = c.higher(ac, bc);
        const gains = levels.some(
          (l) => holds(lo, hi, l) && !holds(af, ac, l) && !holds(bf, bc, l),
        );
        if (gains) continue;
        live = [
          ...live.filter((_, k) => k !== i && k !== j),
          { subject: live[i].subject, floor: c.levels[lo], ceiling: c.levels[hi] },
        ];
        changed = true;
        break outer;
      }
    }
  }

  return live.sort((x, y) => {
    const [xf, xc] = rank(x);
    const [yf, yc] = rank(y);
    return xf - yf || xc - yc;
  });
}

/**
 * WHAT IS MISSING: the weakest changes that get `have` to reach `want`.
 *
 * The question a caller asks after a refusal — not "why not" but "what would
 * I have to change". An empty list means that side already holds.
 *
 * ```text
 *          none    own    team   region   all
 *   have   ●━━━━━━━━━━━━━━━━●
 *   want   ················●━━━━━━━━━━━━━●
 *   need                    ceiling → all
 * ```
 *
 * A LIST because there can be more than one weakest answer. On a plain ladder
 * there is always exactly one, so the list has a single entry and can be read
 * as a value. On a scale where two levels sit side by side, raising past one
 * of them is not the only way up, and picking one to report would be
 * answering confidently about a choice the caller has to make.
 */
export function missing(
  c: Scale,
  have: Unit,
  want: Unit,
): { raiseFloorTo: string[]; raiseCeilingTo: string[] } {
  const [hf, hc] = [c.rank(have.floor), c.rank(have.ceiling)];
  const [wf, wc] = [c.rank(want.floor), c.rank(want.ceiling)];
  const all = [...c.levels.keys()];

  // Every level that would do, then the weakest of those. Taking
  // `higher(have, want)` instead gives an answer that works and is not the
  // smallest one — off a ladder it overshoots.
  const weakestOf = (works: (l: Level) => boolean): string[] => {
    const ok = all.filter(works);
    return ok.filter((l) => !ok.some((o) => o !== l && c.leq(o, l))).map((l) => c.levels[l]);
  };

  return {
    raiseFloorTo: c.leq(wf, hf) ? [] : weakestOf((l) => c.leq(wf, c.higher(hf, l))),
    raiseCeilingTo: c.leq(wc, hc) ? [] : weakestOf((l) => c.leq(wc, c.higher(hc, l))),
  };
}

/**
 * HOW MUCH A STATEMENT ACTUALLY SAYS.
 *
 * A statement names some steps it demands and some it limits. Counting both
 * says how constrained the subject is — a different question from whether the
 * statement can be satisfied.
 *
 * ```text
 *   (bottom, top)   0        says nothing at all
 *   (top, bottom)   maximum  says everything it could
 * ```
 *
 * Useful for ranking: across everything declared about a system, which
 * subjects carry the most, and which carry a rule nobody needed.
 */
export function complexity(c: Scale, u: Unit): number {
  const f = c.rank(u.floor);
  const cl = c.rank(u.ceiling);
  return (
    c.debits().filter((j) => c.leq(j, f)).length + c.limits().filter((m) => c.leq(cl, m)).length
  );
}
