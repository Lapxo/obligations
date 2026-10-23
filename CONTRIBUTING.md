# Contributing

State the mathematical model, domain and hypotheses of a change. Include a proof, a fixed executable case and a counterexample to any stronger claim. Missing data do not imply a value or an independence assumption.

Run `npm ci --ignore-scripts`, `npm run build` and `npm test`. Lean proofs use the toolchain and dependency revisions fixed in `proofs/lean`; compile them with `lake build`, then check `Audit.lean` and `Negatives.lean`.

Keep the runtime independent of applications, transport, authentication services and release tooling. Documentation and mathematical fixtures are written in English.
