import Mathlib.Analysis.SpecialFunctions.Log.Basic
import Mathlib.Algebra.Order.BigOperators.Ring.Finset
import Mathlib.Tactic.Ring
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.FieldSimp
open scoped BigOperators
noncomputable section
namespace Obligations050
section Similarity
variable {ι : Type*}
def quadratic (s : Finset ι) (Z : ι → ι → ℝ) (p : ι → ℝ) : ℝ :=
  ∑ i ∈ s, ∑ j ∈ s, p i * Z i j * p j

theorem quadratic_mono (s : Finset ι) (Z W : ι → ι → ℝ) (p : ι → ℝ)
    (hp : ∀ i ∈ s, 0 ≤ p i) (hZW : ∀ i ∈ s, ∀ j ∈ s, Z i j ≤ W i j) :
    quadratic s Z p ≤ quadratic s W p := by
  apply Finset.sum_le_sum
  intro i hi
  apply Finset.sum_le_sum
  intro j hj
  exact mul_le_mul_of_nonneg_right (mul_le_mul_of_nonneg_left (hZW i hi j hj) (hp i hi)) (hp j hj)

theorem quadratic_ge_diagonal (s : Finset ι) (Z : ι → ι → ℝ) (p : ι → ℝ)
    (hp : ∀ i ∈ s, 0 ≤ p i) (hZ : ∀ i ∈ s, ∀ j ∈ s, 0 ≤ Z i j)
    (hd : ∀ i ∈ s, Z i i = 1) : (∑ i ∈ s, (p i)^2) ≤ quadratic s Z p := by
  apply Finset.sum_le_sum
  intro i hi
  have h := Finset.single_le_sum (s := s) (a := i)
    (fun j hj => mul_nonneg (mul_nonneg (hp i hi) (hZ i hi j hj)) (hp j hj)) hi
  simpa [hd i hi, pow_two] using h

theorem diversity_bounds (s : Finset ι) (Z : ι → ι → ℝ) (p : ι → ℝ)
    (hp : ∀ i ∈ s, 0 ≤ p i) (hs : ∑ i ∈ s, p i = 1)
    (hZ : ∀ i ∈ s, ∀ j ∈ s, 0 ≤ Z i j ∧ Z i j ≤ 1)
    (hd : ∀ i ∈ s, Z i i = 1) :
    0 < quadratic s Z p ∧ 1 ≤ 1 / quadratic s Z p ∧ 1 / quadratic s Z p ≤ s.card := by
  have hdiag := quadratic_ge_diagonal s Z p hp (fun i hi j hj => (hZ i hi j hj).1) hd
  have hc := Finset.sum_mul_sq_le_sq_mul_sq s p (fun _ => (1 : ℝ))
  simp only [mul_one, hs, one_pow, Finset.sum_const, nsmul_eq_mul, mul_one] at hc
  have hlo : 1 ≤ (quadratic s Z p) * (s.card : ℝ) := by
    have hcard : 0 ≤ (s.card : ℝ) := Nat.cast_nonneg _
    nlinarith
  have hpos : 0 < quadratic s Z p := by
    have hcard : 0 ≤ (s.card : ℝ) := Nat.cast_nonneg _
    nlinarith
  have hupper : quadratic s Z p ≤ 1 := by
    have hm := quadratic_mono s Z (fun _ _ => 1) p hp (fun i hi j hj => (hZ i hi j hj).2)
    have he : quadratic s (fun _ _ => 1) p = 1 := by
      simp [quadratic, ← Finset.mul_sum, ← Finset.sum_mul, hs]
    simpa [he] using hm
  exact ⟨hpos, (le_div_iff₀ hpos).2 (by simpa using hupper),
    (div_le_iff₀ hpos).2 (by nlinarith)⟩

theorem diversity_mono (s : Finset ι) (Z W : ι → ι → ℝ) (p : ι → ℝ)
    (hp : ∀ i ∈ s, 0 ≤ p i) (hZW : ∀ i ∈ s, ∀ j ∈ s, Z i j ≤ W i j)
    (hpos : 0 < quadratic s Z p) :
    1 / quadratic s W p ≤ 1 / quadratic s Z p := by
  exact one_div_le_one_div_of_le hpos (quadratic_mono s Z W p hp hZW)

/-- The arbitrary remaining sources are summarized by their common cross-term r and tail t.
This is the exact quadratic identity induced by two equal normalized rows/columns. -/
theorem twins_projection_identity (a b r t : ℝ) :
    a*a + b*b + 2*a*b + 2*a*r + 2*b*r + t = (a+b)^2 + 2*(a+b)*r + t := by ring

theorem twins_simplex_preserved (a b tail : ℝ) (ha : 0 ≤ a) (hb : 0 ≤ b)
    (hs : a+b+tail=1) : 0 ≤ a+b ∧ (a+b)+tail=1 := ⟨add_nonneg ha hb,hs⟩

/-- Any attained maximum inherits the pointwise cardinality bound. No optimizer existence
or algorithm-to-kernel correspondence is silently assumed by this statement. -/
theorem attained_maximum_bound (s : Finset ι) (Z : ι → ι → ℝ) (p : ι → ℝ) (d : ℝ)
    (hp : ∀ i ∈ s, 0 ≤ p i) (hs : ∑ i ∈ s, p i = 1)
    (hZ : ∀ i ∈ s, ∀ j ∈ s, 0 ≤ Z i j ∧ Z i j ≤ 1)
    (hd : ∀ i ∈ s, Z i i = 1) (attained : d = 1 / quadratic s Z p) :
    1 ≤ d ∧ d ≤ s.card := by
  subst d
  exact (diversity_bounds s Z p hp hs hZ hd).2
end Similarity

section Support
/-- Full truth support on positive configurations forces every common function to factor
through the supplied count/projection. The entropy corollary is bibliographic, not asserted
as a Lean entropy theorem here. -/
theorem common_factors_through_projection {X K W : Type*} (positive : X → Prop)
    (supported : X → Bool → Prop) (κ : X → K) (a : X → W) (b : Bool → K → W)
    (full : ∀ x, positive x → supported x false ∧ supported x true)
    (common : ∀ x y, supported x y → a x = b y (κ x)) :
    ∃ c : K → W, ∀ x, positive x → a x = c (κ x) := by
  exact ⟨b false, fun x hx => common x false (full x hx).1⟩
end Support
end Obligations050
#print axioms Obligations050.quadratic_mono
#print axioms Obligations050.diversity_bounds
#print axioms Obligations050.diversity_mono
#print axioms Obligations050.twins_projection_identity
#print axioms Obligations050.twins_simplex_preserved
#print axioms Obligations050.attained_maximum_bound
#print axioms Obligations050.common_factors_through_projection
