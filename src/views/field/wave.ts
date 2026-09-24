import type { Point, Sighting } from '../../field/field.ts';

export interface Claim {
  readonly origin: string;
  readonly epoch: number;
  readonly span: { readonly lo: number; readonly hi: number };
  readonly withdraws?: boolean;
}

/**
 * What a claim carries beside its bound: how much it narrows, which way it points, and when it lands. A withdrawal is
 * the same size pointing the other way, so a claim and its withdrawal at one epoch leave nothing behind them.
 */
export function amplitude(claim: Claim): number {
  const size = claim.span.hi - claim.span.lo;
  const width = Number.isFinite(size) ? 1 / (1 + Math.max(size, 0)) : 0;
  return claim.withdraws ? -width : width;
}

export function phase(claim: Claim, period: number): number {
  return period <= 0 ? 0 : ((claim.epoch % period) + period) % period;
}

/**
 * How together a cell's claims arrive: one when every claim lands at the same turn of the period, and near nothing
 * when they are strewn across it. The measure is the length of what the turns add up to, taken as directions.
 */
export function coherence(claims: readonly Claim[], period: number): number {
  if (!claims.length) return 0;
  let x = 0;
  let y = 0;
  for (const claim of claims) {
    const turn = (2 * Math.PI * phase(claim, period)) / period;
    x += Math.cos(turn);
    y += Math.sin(turn);
  }
  return Math.sqrt(x * x + y * y) / claims.length;
}

/** Claims that arrive together add as one and claims strewn about cancel: what is left is what they made between them. */
export function interfere(claims: readonly Claim[], period: number): number {
  let x = 0;
  let y = 0;
  for (const claim of claims) {
    const turn = (2 * Math.PI * phase(claim, period)) / period;
    x += amplitude(claim) * Math.cos(turn);
    y += amplitude(claim) * Math.sin(turn);
  }
  return Math.sqrt(x * x + y * y) ** 2;
}

export function fringes(claims: readonly Claim[], period: number, delays: readonly number[]): readonly number[] {
  return delays.map((delay) => interfere(claims.map((claim, i) => (i % 2 === 0 ? claim : { ...claim, epoch: claim.epoch + delay })), period));
}

export const seenAs = (cell: Point, period: number): readonly Claim[] =>
  cell.seen.map((s: Sighting) => ({ origin: s.origin, epoch: cell.epoch, span: s.span }));
