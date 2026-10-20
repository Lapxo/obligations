import Mathlib.Data.Fintype.BigOperators
import Mathlib.Algebra.BigOperators.Ring.Finset
import Mathlib.Data.Real.Basic
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.Positivity
import Mathlib.Tactic.Ring
import Mathlib.Tactic.FieldSimp

open scoped BigOperators
noncomputable section
open Classical
namespace Obligations046.BlockCoverage
variable {Ω : Type*} [Fintype Ω]

def avg (μ U : Ω → ℝ) : ℝ := ∑ ω, μ ω * U ω

def iidSum (μ U : Ω → ℝ) : ℕ → (ℝ → ℝ) → ℝ
  | 0, f => f 0
  | n+1, f => ∑ ω, μ ω * iidSum μ U n (fun x => f (U ω+x))

theorem iidSum_mono (μ U : Ω → ℝ) (hμ : ∀ ω, 0 ≤ μ ω) (n : ℕ)
    (f g : ℝ → ℝ) (hfg : ∀ x, f x ≤ g x) : iidSum μ U n f ≤ iidSum μ U n g := by
  induction n generalizing f g with
  | zero => exact hfg 0
  | succ n ih =>
    simp only [iidSum]
    exact Finset.sum_le_sum fun ω _ => mul_le_mul_of_nonneg_left
      (ih _ _ (fun x => hfg (U ω+x))) (hμ ω)

theorem iidSum_quadratic (μ U : Ω → ℝ) (hnorm : ∑ ω, μ ω = 1)
    (n : ℕ) (a b d : ℝ) :
    iidSum μ U n (fun x => a*x^2+b*x+d) =
      a*((n:ℝ)*(avg μ (fun ω => (U ω)^2)-(avg μ U)^2)+((n:ℝ)*avg μ U)^2)+
      b*(n:ℝ)*avg μ U+d := by
  induction n generalizing a b d with
  | zero => simp [iidSum]
  | succ n ih =>
    simp only [iidSum]
    have hf (u : ℝ) : (fun x : ℝ => a*(u+x)^2+b*(u+x)+d) =
        (fun x => a*x^2+(2*a*u+b)*x+(a*u^2+b*u+d)) := by funext x; ring
    simp_rw [hf, ih]
    simp only [Nat.cast_add, Nat.cast_one]
    calc
      _ = ∑ ω, (μ ω * (a*((n:ℝ)*(avg μ (fun ω => (U ω)^2)-(avg μ U)^2)+((n:ℝ)*avg μ U)^2)+b*(n:ℝ)*avg μ U+d) +
          (μ ω*U ω)*(2*a*(n:ℝ)*avg μ U+b) + (μ ω*(U ω)^2)*a) := by
        apply Finset.sum_congr rfl
        intro ω _
        ring
      _ = (∑ ω, μ ω)*(a*((n:ℝ)*(avg μ (fun ω => (U ω)^2)-(avg μ U)^2)+((n:ℝ)*avg μ U)^2)+b*(n:ℝ)*avg μ U+d) +
          avg μ U*(2*a*(n:ℝ)*avg μ U+b)+avg μ (fun ω => (U ω)^2)*a := by
        simp only [avg, Finset.sum_add_distrib, ← Finset.sum_mul]
      _ = _ := by rw [hnorm]; ring

theorem bounded_cell_variance (μ U : Ω → ℝ) (hμ : ∀ ω, 0 ≤ μ ω)
    (_hnorm : ∑ ω, μ ω = 1) (hU : ∀ ω, 0 ≤ U ω ∧ U ω ≤ 1) :
    avg μ (fun ω => (U ω)^2)-(avg μ U)^2 ≤ 1/4 := by
  have hm : avg μ (fun ω => (U ω)^2) ≤ avg μ U := by
    apply Finset.sum_le_sum
    intro ω _
    apply mul_le_mul_of_nonneg_left _ (hμ ω)
    change (U ω)^2 ≤ U ω
    nlinarith [mul_nonneg (hU ω).1 (sub_nonneg.mpr (hU ω).2)]
  nlinarith [sq_nonneg (avg μ U-1/2)]

theorem iid_centered_second (μ U : Ω → ℝ) (hnorm : ∑ ω, μ ω = 1) (n : ℕ) :
    iidSum μ U n (fun x => (x-(n:ℝ)*avg μ U)^2) =
    (n:ℝ)*(avg μ (fun ω => (U ω)^2)-(avg μ U)^2) := by
  have hf : (fun x : ℝ => (x-(n:ℝ)*avg μ U)^2) =
      (fun x => 1*x^2+(-2*(n:ℝ)*avg μ U)*x+((n:ℝ)*avg μ U)^2) := by funext x; ring
  rw [hf, iidSum_quadratic μ U hnorm]
  ring

def bad (n : ℕ) (m eps x : ℝ) : ℝ := if (n:ℝ)*eps ≤ |x-(n:ℝ)*m| then 1 else 0

theorem block_tail_le (μ U : Ω → ℝ) (hμ : ∀ ω, 0 ≤ μ ω)
    (hnorm : ∑ ω, μ ω = 1) (hU : ∀ ω, 0 ≤ U ω ∧ U ω ≤ 1)
    (n : ℕ) (hn : 0 < n) (eps : ℝ) (heps : 0 < eps) :
    iidSum μ U n (bad n (avg μ U) eps) ≤ 1/(4*(n:ℝ)*eps^2) := by
  have hn0 : (0:ℝ) < n := by exact_mod_cast hn
  have hd : 0 < (n:ℝ)^2*eps^2 := by positivity
  have hb (x : ℝ) : bad n (avg μ U) eps x ≤
      (x-(n:ℝ)*avg μ U)^2/((n:ℝ)^2*eps^2) := by
    unfold bad
    split_ifs with h
    · apply (le_div_iff₀ hd).mpr
      have hprod : 0 ≤ (n:ℝ)*eps := by positivity
      have hs := mul_self_le_mul_self hprod h
      have hs' : ((n:ℝ)*eps)^2 ≤ |x-(n:ℝ)*avg μ U|^2 := by nlinarith only [hs]
      rw [sq_abs] at hs'
      nlinarith
    · positivity
  have h := iidSum_mono μ U hμ n _ _ hb
  have hf : (fun x : ℝ => (x-(n:ℝ)*avg μ U)^2/((n:ℝ)^2*eps^2)) =
      (fun x => (1/((n:ℝ)^2*eps^2))*x^2+
        (-2*(n:ℝ)*avg μ U/((n:ℝ)^2*eps^2))*x+
        ((n:ℝ)*avg μ U)^2/((n:ℝ)^2*eps^2)) := by funext x; ring
  rw [hf, iidSum_quadratic μ U hnorm] at h
  have hm := bounded_cell_variance μ U hμ hnorm hU
  have heq :
      (1/((n:ℝ)^2*eps^2))*((n:ℝ)*(avg μ (fun ω => (U ω)^2)-(avg μ U)^2)+((n:ℝ)*avg μ U)^2)+
        (-2*(n:ℝ)*avg μ U/((n:ℝ)^2*eps^2))*(n:ℝ)*avg μ U+
        ((n:ℝ)*avg μ U)^2/((n:ℝ)^2*eps^2) =
      (avg μ (fun ω => (U ω)^2)-(avg μ U)^2)/((n:ℝ)*eps^2) := by
    field_simp
    ring
  rw [heq] at h
  calc
    _ ≤ (avg μ (fun ω => (U ω)^2)-(avg μ U)^2)/((n:ℝ)*eps^2) := h
    _ ≤ (1/4)/((n:ℝ)*eps^2) := div_le_div_of_nonneg_right hm (by positivity)
    _ = _ := by ring

-- Shared-member pairs are one block, not independent observations.
theorem pair_pseudoreplication_negative : (157/2048:ℚ) > 1/(4*6) := by norm_num

def indicator (b : Bool) : ℝ := if b then 1 else 0

theorem indicator_union_pointwise (a b c : Bool) :
    indicator (a || b || c) ≤ indicator a+indicator b+indicator c := by
  cases a <;> cases b <;> cases c <;> norm_num [indicator]

def prob (μ : Ω → ℝ) (A : Ω → Bool) : ℝ := avg μ (fun ω => indicator (A ω))

theorem union3 (μ : Ω → ℝ) (hμ : ∀ ω, 0 ≤ μ ω) (A B C : Ω → Bool) :
    prob μ (fun ω => A ω || B ω || C ω) ≤ prob μ A+prob μ B+prob μ C := by
  calc
    _ ≤ avg μ (fun ω => indicator (A ω)+indicator (B ω)+indicator (C ω)) := by
      apply Finset.sum_le_sum
      intro ω _
      exact mul_le_mul_of_nonneg_left (indicator_union_pointwise (A ω) (B ω) (C ω)) (hμ ω)
    _ = _ := by simp [prob, avg, mul_add, Finset.sum_add_distrib]

theorem prob_le_one (μ : Ω → ℝ) (hμ : ∀ ω, 0 ≤ μ ω)
    (hnorm : ∑ ω, μ ω = 1) (A : Ω → Bool) : prob μ A ≤ 1 := by
  calc
    _ ≤ ∑ ω, μ ω := by
      apply Finset.sum_le_sum
      intro ω _
      have hi : indicator (A ω) ≤ 1 := by cases A ω <;> norm_num [indicator]
      simpa only [mul_one] using mul_le_mul_of_nonneg_left hi (hμ ω)
    _ = 1 := hnorm

theorem clipped_union_budget (μ : Ω → ℝ) (hμ : ∀ ω, 0 ≤ μ ω)
    (hnorm : ∑ ω, μ ω = 1) (A B C : Ω → Bool) (d bp bc : ℝ)
    (hA : prob μ A ≤ d) (hB : prob μ B ≤ bp) (hC : prob μ C ≤ bc) :
    prob μ (fun ω => A ω || B ω || C ω) ≤ min 1 (d+bp+bc) := by
  apply le_min (prob_le_one μ hμ hnorm _)
  have h := union3 μ hμ A B C
  linarith

theorem clipped_block_tail (μ U : Ω → ℝ) (hμ : ∀ ω, 0 ≤ μ ω)
    (hnorm : ∑ ω, μ ω = 1) (hU : ∀ ω, 0 ≤ U ω ∧ U ω ≤ 1)
    (n : ℕ) (hn : 0 < n) (eps : ℝ) (heps : 0 < eps) :
    iidSum μ U n (bad n (avg μ U) eps) ≤ min 1 (1/(4*(n:ℝ)*eps^2)) := by
  apply le_min
  · have h := iidSum_mono μ U hμ n (bad n (avg μ U) eps) (fun _ => 1) (fun x => by
      unfold bad
      split_ifs <;> norm_num)
    have hc : iidSum μ U n (fun _ => 1) = 1 := by
      simpa using iidSum_quadratic μ U hnorm n 0 0 1
    simpa only [hc] using h
  · exact block_tail_le μ U hμ hnorm hU n hn eps heps

end Obligations046.BlockCoverage
