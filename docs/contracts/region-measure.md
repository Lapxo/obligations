# Finite measures on declared regions

Let U be a finite set of named atoms and let w:U -> Q be nonnegative. Define m(A)=sum_{a in A} w(a) for A subset U. Atom names identify members of this declared support; they do not establish authentication or physical completeness.

For every atom, 1_A(a)+1_B(a)=1_(A union B)(a)+1_(A intersection B)(a). Multiplying by w(a) and summing gives m(A)+m(B)=m(A union B)+m(A intersection B). In particular, disjoint supports imply additive measurements. Overlap may still have zero weight; equality of totals does not imply disjoint supports.

For a finite family A_i, put r(a)=the number of distinct regions containing a. Then sum_i m(A_i)-m(union_i A_i)=sum_{a:r(a)>0}(r(a)-1)w(a). This exact nonnegative excess explains double counting. Adding a duplicate delivery of the same atom does not create a second support element. Two different weights under the same atom identity refuse as conflicting inputs.

No theorem here infers a lattice's distributivity, a cancellation operation, an exact withdrawal, a tokenizer law, a clock law or an authorization. Those require their respective contracts. Selector names are not supports; a host must supply the actual identified members. An unassigned atom and an empty declared region remain visible.

The pairwise union/intersection identity, disjoint additivity and the nonnegative union bound are kernel-checked in `lean/Obligations/RegionMeasure.lean`. The arbitrary finite-family excess formula above remains a written finite-sum derivation. The TypeScript implementation's correspondence to Lean is tested on bounded vectors, not kernel-proved. These three evidence scopes remain separate.

## Public consumption

`finiteRegionMeasure` and type `RegionMeasure` are available through the candidate `@lapxo/obligations/measures` export. The existing subpath remains unchanged. Measurements require an explicit model, unit, finite support and deterministic input-row budget. a structured-data consumer supplies selector interpretation; a constraint evaluator applies authority and ceilings.

The supplemental reader seals declared inputs and replays finite mathematical cases. Compilation evidence is reused only for the same proof sources and pinned toolchain; it does not claim a new Lean execution during receipt replay. Owner admission and release delivery are separate acts. T2 remains outside this selection.
