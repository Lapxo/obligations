import Mathlib.Analysis.SpecialFunctions.Log.Basic
import Mathlib.Algebra.Order.BigOperators.Ring.Finset
import Mathlib.Tactic.Ring
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.FieldSimp
open scoped BigOperators
noncomputable section
namespace Obligations050.KL
variable {α β : Type*} [Fintype α] [Fintype β]
/-- Natural-log KL on finite full support; division by log 2 changes unit only. -/
def kl (P Q : α → ℝ) : ℝ := ∑ i, P i * Real.log (P i / Q i)

theorem reindex (e : α ≃ β) (P Q : β → ℝ) :
    kl (P ∘ e) (Q ∘ e) = kl P Q := by
  exact e.sum_comp (fun i => P i * Real.log (P i / Q i))

theorem product_log (a b c d : ℝ) (ha : 0 < a) (hb : 0 < b)
    (hc : 0 < c) (hd : 0 < d) :
    Real.log ((a*c)/(b*d)) = Real.log (a/b) + Real.log (c/d) := by
  rw [mul_div_mul_comm, Real.log_mul (ne_of_gt (div_pos ha hb)) (ne_of_gt (div_pos hc hd))]

theorem independent_product (P Q : α → ℝ) (R S : β → ℝ)
    (hP : ∀ i, 0 < P i) (hQ : ∀ i, 0 < Q i)
    (hR : ∀ j, 0 < R j) (hS : ∀ j, 0 < S j)
    (nP : ∑ i, P i = 1) (nR : ∑ j, R j = 1) :
    kl (fun x : α × β => P x.1 * R x.2) (fun x => Q x.1 * S x.2) = kl P Q + kl R S := by
  unfold kl
  rw [Fintype.sum_prod_type]
  simp_rw [product_log _ _ _ _ (hP _) (hQ _) (hR _) (hS _)]
  simp_rw [mul_add]
  simp_rw [Finset.sum_add_distrib]
  have left : (∑ i, ∑ j, P i * R j * Real.log (P i / Q i)) = ∑ i, P i * Real.log (P i / Q i) := by
    apply Finset.sum_congr rfl
    intro i hi
    calc
      (∑ j, P i * R j * Real.log (P i / Q i)) = (P i * Real.log (P i / Q i)) * ∑ j, R j := by
        rw [Finset.mul_sum]
        apply Finset.sum_congr rfl
        intro j hj
        ring
      _ = _ := by rw [nR, mul_one]
  have right : (∑ i, ∑ j, P i * R j * Real.log (R j / S j)) = ∑ j, R j * Real.log (R j / S j) := by
    calc
      (∑ i, ∑ j, P i * R j * Real.log (R j / S j)) = (∑ i, P i) * ∑ j, R j * Real.log (R j / S j) := by
        simp_rw [mul_assoc, ← Finset.mul_sum]
        rw [Finset.sum_mul]
      _ = _ := by rw [nP, one_mul]
  rw [left, right]

/-- Ratio additivity needs one positive common reference. Heterogeneous denominators
are not normalized away. -/
theorem common_reference_add (a b d : ℝ) : (a+b)/d = a/d+b/d := by ring

theorem normalized_identical_blocks (n : ℕ) (d : ℝ) (hd : 0 < d) :
    ((n : ℝ)*d)/d = n := by field_simp

omit [Fintype α] in
theorem bounded_blocks (s : Finset α) (d : ℝ) (v : α → ℝ) (hd : 0 < d)
    (hv : ∀ i ∈ s, v i ≤ d) : (∑ i ∈ s, v i)/d ≤ s.card := by
  apply (div_le_iff₀ hd).2
  have h := Finset.sum_le_sum hv
  simpa [Finset.sum_const, nsmul_eq_mul] using h
end Obligations050.KL
#print axioms Obligations050.KL.reindex
#print axioms Obligations050.KL.product_log
#print axioms Obligations050.KL.independent_product
#print axioms Obligations050.KL.common_reference_add
#print axioms Obligations050.KL.normalized_identical_blocks
#print axioms Obligations050.KL.bounded_blocks
