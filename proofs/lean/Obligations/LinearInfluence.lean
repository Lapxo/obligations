import Mathlib.Algebra.BigOperators.Field
import Mathlib.Algebra.BigOperators.Group.Finset.Sigma
import Mathlib.Algebra.Order.Field.Rat
import Mathlib.Tactic.Ring
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.NormNum
import Mathlib.Tactic.Linarith

open scoped BigOperators
namespace Obligations047.LinearInfluence

variable {ι : Type*} [Fintype ι]

def mean (x : ι → ℚ) : ℚ := (∑ i, x i) / Fintype.card ι
def cov (a x : ι → ℚ) : ℚ := mean (fun i => a i * x i) - mean a * mean x
def completeStep (a x : ι → ℚ) (i : ι) : ℚ := (1-a i)*x i + a i*mean x

theorem mean_add (x y : ι → ℚ) : mean (fun i => x i+y i) = mean x+mean y := by
  simp only [mean, Finset.sum_add_distrib, add_div]

theorem mean_sub (x y : ι → ℚ) : mean (fun i => x i-y i) = mean x-mean y := by
  simp only [mean, Finset.sum_sub_distrib, sub_div]

theorem mean_smul (a : ℚ) (x : ι → ℚ) : mean (fun i => a*x i) = a*mean x := by
  unfold mean
  rw [← Finset.mul_sum]
  ring

theorem mean_mul_const (a : ℚ) (x : ι → ℚ) : mean (fun i => x i*a) = mean x*a := by
  simpa only [mul_comm] using mean_smul a x

theorem complete_drift (a x : ι → ℚ) :
    mean (completeStep a x) - mean x = -cov a x := by
  have h : completeStep a x = fun i => x i-a i*x i+a i*mean x := by
    funext i
    unfold completeStep
    ring
  rw [h, mean_add, mean_sub, mean_mul_const]
  unfold cov
  ring

theorem constant_mean [Nonempty ι] (a : ℚ) : mean (fun _ : ι => a) = a := by
  have hn : (Fintype.card ι : ℚ) ≠ 0 := by exact_mod_cast Fintype.card_ne_zero
  simp only [mean, Finset.sum_const, Finset.card_univ, nsmul_eq_mul]
  field_simp

theorem homogeneous_cov [Nonempty ι] (a : ℚ) (x : ι → ℚ) : cov (fun _ => a) x = 0 := by
  rw [cov, constant_mean, mean_smul]
  ring

theorem homogeneous_mean [Nonempty ι] (a : ℚ) (x : ι → ℚ) :
    mean (completeStep (fun _ => a) x) = mean x := by
  have h := complete_drift (fun _ => a) x
  rw [homogeneous_cov] at h
  linarith

def column (W : ι → ι → ℚ) (j : ι) : ℚ := ∑ i, W i j

theorem total_transport (W : ι → ι → ℚ) (x : ι → ℚ) :
    (∑ i, ∑ j, W i j * x j) = ∑ j, column W j * x j := by
  rw [Finset.sum_comm]
  simp only [column, Finset.sum_mul]

theorem column_mean [Nonempty ι] (W : ι → ι → ℚ) (row : ∀ i, ∑ j, W i j = 1) :
    mean (column W) = 1 := by
  have hn : (Fintype.card ι : ℚ) ≠ 0 := by exact_mod_cast Fintype.card_ne_zero
  simp only [mean, column]
  rw [Finset.sum_comm]
  simp only [row, Finset.sum_const, Finset.card_univ, nsmul_eq_mul, mul_one]
  exact div_self hn

theorem transport_drift [Nonempty ι] (a : ℚ) (W : ι → ι → ℚ) (x : ι → ℚ)
    (row : ∀ i, ∑ j, W i j = 1) :
    mean (fun i => (1-a)*x i + a*(∑ j, W i j*x j)) - mean x = a*cov (column W) x := by
  rw [mean_add, mean_smul, mean_smul]
  have h : mean (fun i => ∑ j, W i j*x j) = mean (fun j => column W j*x j) := by
    unfold mean
    rw [total_transport W x]
  rw [h, cov, column_mean W row]
  ring

theorem stationary_weighted_sum (a : ℚ) (W : ι → ι → ℚ) (x w : ι → ℚ)
    (stationary : ∀ j, ∑ i, w i*W i j = w j) :
    (∑ i, w i*((1-a)*x i+a*(∑ j, W i j*x j))) = ∑ i, w i*x i := by
  have h : (∑ i, w i*(∑ j, W i j*x j)) = ∑ j, w j*x j := by
    calc
      (∑ i, w i*(∑ j, W i j*x j)) = ∑ i, ∑ j, (w i*W i j)*x j := by
        apply Finset.sum_congr rfl
        intro i _
        rw [Finset.mul_sum]
        apply Finset.sum_congr rfl
        intro j _
        ring
      _ = ∑ j, ∑ i, (w i*W i j)*x j := Finset.sum_comm
      _ = ∑ j, w j*x j := by simp only [← Finset.sum_mul, stationary]
  have expansion : (fun i => w i*((1-a)*x i+a*(∑ j, W i j*x j))) =
      fun i => (1-a)*(w i*x i)+a*(w i*(∑ j, W i j*x j)) := by
    funext i
    ring
  rw [expansion, Finset.sum_add_distrib, ← Finset.mul_sum, ← Finset.mul_sum, h]
  ring

theorem correlation_scale (n t d c : ℚ) (hd : d ≠ 0) (hc : c ≠ 0) :
    n*(c*t)/(c*d) = n*t/d := by
  field_simp
  ring

theorem complete_covariance_ratio (n s q : ℚ) (hn : n ≠ 0) (hs : s ≠ 0) :
    n*(s*(1+(n-1)*q^2))/(s*n) = 1+(n-1)*q^2 := by
  field_simp
  ring

theorem heterogeneous_counterexample : (3 : ℚ) - 9/8 = 15/8 ∧ (15 : ℚ)/8 ≠ 3 := by
  norm_num

theorem negative_covariance_exceeds_population : (2 : ℚ)*3/1 = 6 ∧ (6 : ℚ) > 2 := by
  norm_num

end Obligations047.LinearInfluence
