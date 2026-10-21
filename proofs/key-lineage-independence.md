# Key identifiers do not identify an independent joint law

Fix two key identifiers and the same declared provenance metadata. Model C samples one fair bit B and sets X=Y=B. Model I samples independent fair bits X and Y. The key identifiers and provenance declarations are unchanged across the models.

In C, P(X=0,Y=0)=1/2 while P(X=0)P(Y=0)=1/4. The factorization claim is false. In I, every joint atom has mass 1/4 and the displayed binary joint law factors. Both laws are compatible with the same identifiers and labels, so those metadata do not entail independence. This countermodel refutes that implication without a statistical experiment.

Under a declared common-control model, two keys may share one named control group. Splitting their provenance labels changes the declared grouping, not the response law. The vector reports group counts only as declarations and never as identified independent K.

The existing marginalInformation computes one bit of information between identical fair bits and zero between independent fair bits under these exact priors. Its numeric policy remains explicit. Renaming a lineage changes attribution but does not change this calculation. These cases reuse extension-lineage-participation@1; they add no causal estimator and perform no signature generation or authority admission.

`lean/Obligations/KeyLineage.lean` checks nonnegativity, normalization, equal fair marginals, factorization of the independent table and failure of factorization of the copied table. It also checks that either table can be paired with the same arbitrary metadata. The numerical information outputs reuse the existing API and are executable vectors, not a new Lean entropy theorem.
