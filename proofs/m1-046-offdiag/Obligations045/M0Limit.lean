import Mathlib.Topology.Instances.Real.Lemmas
import Mathlib.Data.Real.Archimedean
import Mathlib.Topology.Algebra.Order.Field
import Mathlib.Algebra.Order.Floor.Ring
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.Ring
import Mathlib.Tactic.NormNum
import Mathlib.Tactic.Positivity

open scoped BigOperators
open Filter Topology
noncomputable section
open Classical
namespace Obligations045.M0

/-- Declared binary M0 domain. This structure contains no limiting-probability axiom. -/
structure Domain where
  K : ℕ
  K_pos : 0 < K
  p : ℝ
  c : ℝ
  p_half : (1:ℝ)/2 < p
  p_lt_one : p < 1
  c_nonneg : 0 ≤ c
  c_lt_one : c < 1
  w : ℕ → ℝ
  w_nonneg : ∀ i, 0 ≤ w i
  weights_sum : ∑ i ∈ Finset.range K, w i = 1

def cumulative (w : ℕ → ℝ) (i : ℕ) : ℝ := ∑ j ∈ Finset.range i, w j

def allocation (w : ℕ → ℝ) (N i : ℕ) : ℕ :=
  ⌊(N:ℝ) * cumulative w (i+1)⌋₊ - ⌊(N:ℝ) * cumulative w i⌋₊

theorem prefix_succ (w : ℕ → ℝ) (i : ℕ) :
    cumulative w (i+1) = cumulative w i + w i := by simp [cumulative, Finset.sum_range_succ]

theorem prefix_monotone (w : ℕ → ℝ) (hw : ∀ i, 0 ≤ w i) : Monotone (cumulative w) := by
  apply monotone_nat_of_le_succ
  intro i
  rw [prefix_succ]
  exact le_add_of_nonneg_right (hw i)

theorem allocation_sum (M : Domain) (N : ℕ) :
    ∑ i ∈ Finset.range M.K, allocation M.w N i = N := by
  let f : ℕ → ℕ := fun i => ⌊(N:ℝ) * cumulative M.w i⌋₊
  have hf : Monotone f := fun i j hij =>
    Nat.floor_mono (mul_le_mul_of_nonneg_left (prefix_monotone M.w M.w_nonneg hij) (by positivity))
  change ∑ i ∈ Finset.range M.K, (f (i+1) - f i) = N
  rw [Finset.sum_range_tsub hf]
  simp [f, cumulative, M.weights_sum]

theorem allocation_discrepancy (M : Domain) (N i : ℕ) :
    -1 < (allocation M.w N i : ℝ) - (N:ℝ)*M.w i ∧
    (allocation M.w N i : ℝ) - (N:ℝ)*M.w i < 1 := by
  have hpre : 0 ≤ cumulative M.w i := Finset.sum_nonneg (fun j _ => M.w_nonneg j)
  have hnext : 0 ≤ cumulative M.w (i+1) := Finset.sum_nonneg (fun j _ => M.w_nonneg j)
  have hm : ⌊(N:ℝ)*cumulative M.w i⌋₊ ≤ ⌊(N:ℝ)*cumulative M.w (i+1)⌋₊ :=
    Nat.floor_mono (mul_le_mul_of_nonneg_left (prefix_monotone M.w M.w_nonneg (Nat.le_succ i)) (by positivity))
  have a := Nat.floor_le (mul_nonneg (Nat.cast_nonneg N) hpre)
  have b := Nat.lt_floor_add_one ((N:ℝ)*cumulative M.w i)
  have c := Nat.floor_le (mul_nonneg (Nat.cast_nonneg N) hnext)
  have d := Nat.lt_floor_add_one ((N:ℝ)*cumulative M.w (i+1))
  have hs := prefix_succ M.w i
  simp only [allocation, Nat.cast_sub hm]
  constructor <;> nlinarith

def q (M : Domain) (a : Bool) : ℝ := (1-M.c)*M.p + if a then M.c else 0

theorem q_pos (M : Domain) (a : Bool) : 0 < q M a := by
  have hp : 0 < M.p := by linarith [M.p_half]
  cases a <;> simp only [q, Bool.false_eq_true, ite_false, add_zero, ite_true] <;>
    nlinarith [M.c_nonneg, M.c_lt_one]

theorem q_lt_one (M : Domain) (a : Bool) : q M a < 1 := by
  have hp : 0 < M.p := by linarith [M.p_half]
  cases a <;> simp only [q, Bool.false_eq_true, ite_false, add_zero, ite_true] <;>
    nlinarith [M.c_nonneg, M.c_lt_one, M.p_lt_one]

def score (M : Domain) (a : Fin M.K → Bool) : ℝ :=
  ∑ i : Fin M.K, M.w i * q M (a i)

def latentMass (M : Domain) (a : Fin M.K → Bool) : ℝ :=
  ∏ i : Fin M.K, if a i then M.p else 1-M.p

def fairLoss (correct total : ℕ) : ℝ :=
  if 2*correct < total then 1 else if 2*correct = total then 1/2 else 0

/-- The exact finite conditional error, using independent binomial counts in each lineage. -/
noncomputable def conditionalError (M : Domain) (N : ℕ) (a : Fin M.K → Bool) : ℝ :=
  ∑ x : (i : Fin M.K) → Fin (allocation M.w N i + 1),
    (∏ i : Fin M.K,
      (Nat.choose (allocation M.w N i) (x i) : ℝ) *
      q M (a i) ^ (x i : ℕ) *
      (1-q M (a i)) ^ (allocation M.w N i - (x i : ℕ))) *
    fairLoss (∑ i : Fin M.K, (x i : ℕ)) N

noncomputable def error (M : Domain) (N : ℕ) : ℝ :=
  ∑ a : Fin M.K → Bool, latentMass M a * conditionalError M N a

noncomputable def limitingLoss (s : ℝ) : ℝ :=
  if s < 1/2 then 1 else if s = 1/2 then 1/2 else 0

noncomputable def floor (M : Domain) : ℝ :=
  ∑ a : Fin M.K → Bool, latentMass M a * limitingLoss (score M a)

/-- Explicit proof obligations, NOT assumptions hidden inside the generative model.
    The strict branches require concentration. The equality branch requires a CLT.
    This certificate has no constructed instance in this project. -/
def ConditionalTailLimits (M : Domain) : Prop :=
  (∀ a, score M a < 1/2 → Tendsto (fun N => conditionalError M N a) atTop (𝓝 1)) ∧
  (∀ a, 1/2 < score M a → Tendsto (fun N => conditionalError M N a) atTop (𝓝 0)) ∧
  (∀ a, score M a = 1/2 → Tendsto (fun N => conditionalError M N a) atTop (𝓝 (1/2)))

/-- Kernel checked finite-mixture transfer. This is intentionally conditional;
    it does not claim that ConditionalTailLimits follows from Domain. -/
theorem limit_of_conditional_tail_limits (M : Domain) (h : ConditionalTailLimits M) :
    Tendsto (error M) atTop (𝓝 (floor M)) := by
  have hcase : ∀ a, Tendsto (fun N => conditionalError M N a) atTop
      (𝓝 (limitingLoss (score M a))) := by
    intro a
    by_cases hl : score M a < 1/2
    · rw [limitingLoss, if_pos hl]
      exact h.1 a hl
    · by_cases he : score M a = 1/2
      · rw [limitingLoss, if_neg hl, if_pos he]
        exact h.2.2 a he
      · have hg : 1/2 < score M a := lt_of_le_of_ne (le_of_not_gt hl) (Ne.symm he)
        rw [limitingLoss, if_neg hl, if_neg he]
        exact h.2.1 a hg
  unfold error floor
  exact tendsto_finset_sum _ (fun a _ => tendsto_const_nhds.mul (hcase a))

end Obligations045.M0
