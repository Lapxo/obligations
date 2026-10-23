# Finite measure proof records

Thirteen named Lean4.19.0 theorems are mapped to their exact source digests and hypotheses. Mathlib is fixed to c44e0c8ee63ca166450922a373c7409c5d26b00b. Only propext, Classical.choice and Quot.sound are accepted by the reused axiom auditor. Zero-reference normalization without its hypothesis fails, and an extra local axiom is rejected even though its source compiles.

This does not kernel-prove the rational optimizer implementation, the entropy common-part corollary, the six axioms of N in an unspecified model, or the cited common-maximum theorem. Those distinctions are in the theorem map. The native reader audits exact source/record correspondence; CI also compiles the pinned proof project. No experimental campaign is run.
