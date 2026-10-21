import Mathlib.Algebra.Order.Field.Rat
import Mathlib.Tactic.Ring
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.NormNum
import Mathlib.Tactic.Linarith
namespace Obligations047.ThresholdBoundary

def gap (p c : ℚ) : ℚ := (1-c)*(2*p-1)-c

theorem gap_identity (p c : ℚ) : gap p c = 2*p*(1-c)-1 := by
  unfold gap
  ring

theorem positive_gap (p c : ℚ) (hp : (1:ℚ)/2 < p) :
    0 < gap p c ↔ c < 1-1/(2*p) := by
  have h2p : 0 < 2*p := by linarith
  rw [gap_identity]
  constructor
  · intro h
    have hdiv : (1:ℚ)/(2*p) < 1-c := (div_lt_iff₀ h2p).2 (by nlinarith)
    linarith
  · intro h
    have hdiv : (1:ℚ)/(2*p) < 1-c := by linarith
    have hmul := (div_lt_iff₀ h2p).1 hdiv
    nlinarith

theorem threshold_range (p : ℚ) (hp : (1:ℚ)/2 < p) (hp1 : p < 1) :
    0 < 1-1/(2*p) ∧ 1-1/(2*p) < (1:ℚ)/2 := by
  have h2p : 0 < 2*p := by linarith
  have ha : (1:ℚ)/(2*p) < 1 := (div_lt_iff₀ h2p).2 (by linarith)
  have hb : (1:ℚ)/2 < 1/(2*p) := (lt_div_iff₀ h2p).2 (by linarith)
  constructor <;> linarith

theorem fair_two_votes (p : ℚ) :
    (1-p)^2 + (1/2:ℚ)*(2*p*(1-p)) = 1-p := by ring

theorem fair_three_votes :
    (1-(3/4:ℚ))^3 + 3*(3/4:ℚ)*(1-(3/4:ℚ))^2 = 5/32 := by norm_num

end Obligations047.ThresholdBoundary
