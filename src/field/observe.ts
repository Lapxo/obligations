import { UnitError } from '../lattice/errors.ts';
import type { Act, Claim, Obligatory } from '../lattice/obligatory.ts';

/**
 * Observe, the floor's act on one cell: one more claim, from an origin, at an epoch. At s = −1 it is the withdrawal, the
 * same act taken back: a line that names the claim it takes by its id, so the cell returns to what it held without it,
 * every claim stays on it, and nothing is matched by looking like something.
 */
export function observe<T>(c: Obligatory<T>, claim: Claim<T>, s: Act = claim.takes === undefined ? 1 : -1): Obligatory<T> {
  const takes = s === 1 ? undefined : claim.takes ?? claim.id;
  if (s === 1 && claim.takes !== undefined) throw new UnitError('sign-mismatch', 'obligations: REFUSE·observe a claim that takes another back is observed at −1, never at +1');
  if (s === -1 && takes === undefined) throw new UnitError('withdrawal-unnamed', 'obligations: REFUSE·observe a withdrawal names the claim it takes back, never a value that looks like it');
  const line: Claim<T> = takes === undefined ? claim : { origin: claim.origin, span: claim.span, sign: -1, takes, ...(claim.at === undefined ? {} : { at: claim.at }) };
  return { ...c, epoch: Math.max(c.epoch, claim.at ?? c.epoch), seen: [...c.seen, line] };
}
