import Mathlib.Algebra.Order.Field.Rat
import Mathlib.Tactic.NormNum

namespace Obligations047.KeyLineage

def copiedJoint (x y : Bool) : ℚ := if x = y then 1 / 2 else 0
def independentJoint (_x _y : Bool) : ℚ := 1 / 4

theorem copied_nonnegative (x y : Bool) : 0 ≤ copiedJoint x y := by
  cases x <;> cases y <;> norm_num [copiedJoint]

theorem independent_nonnegative (x y : Bool) : 0 ≤ independentJoint x y := by
  norm_num [independentJoint]

theorem copied_normalized :
    copiedJoint false false + copiedJoint false true +
    copiedJoint true false + copiedJoint true true = 1 := by norm_num [copiedJoint, independentJoint]

theorem independent_normalized :
    independentJoint false false + independentJoint false true +
    independentJoint true false + independentJoint true true = 1 := by norm_num [copiedJoint, independentJoint]

theorem same_fair_marginals (x : Bool) :
    copiedJoint x false + copiedJoint x true = 1 / 2 ∧
    copiedJoint false x + copiedJoint true x = 1 / 2 ∧
    independentJoint x false + independentJoint x true = 1 / 2 ∧
    independentJoint false x + independentJoint true x = 1 / 2 := by
  cases x <;> norm_num [copiedJoint, independentJoint]

theorem copied_not_factorized : copiedJoint false false ≠ (1 / 2 : ℚ) * (1 / 2) := by norm_num [copiedJoint, independentJoint]

theorem independent_factorized (x y : Bool) :
    independentJoint x y = (1 / 2 : ℚ) * (1 / 2) := by norm_num [copiedJoint, independentJoint]

/-- The same metadata can accompany either law. Metadata do not select a joint law. -/
theorem same_metadata_two_joint_laws {Metadata : Type*} (metadata : Metadata) :
    (metadata, copiedJoint false false) ≠ (metadata, independentJoint false false) := by
  intro h
  have bad := congrArg Prod.snd h
  exact (by norm_num [copiedJoint, independentJoint] : copiedJoint false false ≠ independentJoint false false) bad

end Obligations047.KeyLineage
