import Mathlib.Algebra.Order.BigOperators.Group.Finset
import Mathlib.Algebra.Order.Field.Rat

open scoped BigOperators

namespace Obligations047.RegionMeasure

def measure {ι : Type*} (w : ι → ℚ) (A : Finset ι) : ℚ := ∑ a ∈ A, w a

theorem union_inter {ι : Type*} [DecidableEq ι] (w : ι → ℚ) (A B : Finset ι) :
    measure w (A ∪ B) + measure w (A ∩ B) = measure w A + measure w B := by
  exact Finset.sum_union_inter

theorem disjoint_union {ι : Type*} [DecidableEq ι] (w : ι → ℚ)
    (A B : Finset ι) (h : Disjoint A B) :
    measure w (A ∪ B) = measure w A + measure w B := by
  exact Finset.sum_union h

theorem union_le_sum {ι : Type*} [DecidableEq ι] (w : ι → ℚ)
    (A B : Finset ι) (hw : ∀ a ∈ A ∩ B, 0 ≤ w a) :
    measure w (A ∪ B) ≤ measure w A + measure w B := by
  have hi : 0 ≤ measure w (A ∩ B) := Finset.sum_nonneg hw
  calc
    measure w (A ∪ B) ≤ measure w (A ∪ B) + measure w (A ∩ B) := le_add_of_nonneg_right hi
    _ = measure w A + measure w B := union_inter w A B

end Obligations047.RegionMeasure
