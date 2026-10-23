# Authorship value

`authorshipValue(joint, policy)` reads `I(Y;X|K)` for named binary sources and their binary sum K under one declared finite joint prior. It uses the existing marginal-information implementation and its projection-loss engine; it does not implement another entropy routine.

Both declared truth values must have positive mass at every positive-mass configuration for the full-support lemma to identify the residual with V. The zero-support result can still measure V, but leaves that correspondence unmeasured with `authorship-value/support-with-zeros`. It does not assume that every zero breaks the correspondence. Exact rational support is independent of binary64 entropy precision.

Source identifiers, lineage labels and atom identities remain in the parameters. They do not supply authority or independence. This reading never rewrites a cell or retires a declaration. Budgets, missing-prior behavior and validation reuse the existing mathematical functions. No new runtime dependency, clock, experiment or signer is introduced.

See the [written proof](../../proofs/authorship-value.md), [contract](../../contracts/authorship-value.json) and [two fixed vectors](../../vectors/laws/authorship-value.json). A thin reader consumes the public API; captured native vectors and digest bindings are prepared separately. Admission and publication resolve through the instrument and approved carrier; the entropy-level Lean corollary remains pending.
