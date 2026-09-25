import { UnitError } from '../lattice/errors.ts';
import { mark } from '../lattice/obligatory.ts';
import type { Lattice } from '../lattice/lattice.ts';
import type { Obligatory } from '../lattice/obligatory.ts';

/**
 * Join, the ceiling's widening on one cell alone: it lands only with a witness, it never travels to a cell that rests
 * on this one, and a signature taken after it narrows it again, which is why the line carries who stood for it.
 */
export function join<T>(L: Lattice<T>, c: Obligatory<T>, span: T, witness: string, at?: number): Obligatory<T> {
  if (witness === '') throw new UnitError('join-unwitnessed', 'obligations: REFUSE·join a widening lands only with a witness or the signatures of whoever rests on the old bound');
  return { ...c, marks: [...(c.marks ?? []), mark({ pole: 'ceiling', reach: 'local', span: L.meet(L.top, span), widens: witness, ...(at === undefined ? {} : { at }) })] };
}
