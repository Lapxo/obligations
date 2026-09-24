/**
 * Abstract valuation. Tariffing is not creating or composing: the register
 * is lossless, and the price is not a function of these coordinates.
 *
 * Nothing here is a product noun. A caller that needs `(level) => number`
 * writes that type at the call site.
 */
export { defect, dropTo, price, slack, spectrum } from './quote.ts';
export type { Price, SpectrumQuantity } from './quote.ts';

export {
  best,
  c_n,
  collapses,
  costOfState,
  gap,
  isSupermodular,
  premium,
  pricesAnything,
} from './premium.ts';

export { meetBlocks } from './blocks.ts';
export { attainable, classifyValue } from './attainable.ts';
export type { Attainability } from './attainable.ts';

/** How much a statement says — the valuation the trilemma names. */
export { complexity } from '../../debit/unit.ts';
