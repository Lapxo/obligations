import Obligations

/-- error: tactic 'decide' proved that the proposition
  { lo := 5, hi := 3 } = { lo := 8, hi := 6 }
is false -/
#guard_msgs in
example : (⟨5, 3⟩ : Obligations.Cell Nat) = ⟨8, 6⟩ := by decide

/-- error: tactic 'decide' proved that the proposition
  (Obligations.HellyComb.triple != []) = true
is false -/
#guard_msgs in
example : (Obligations.HellyComb.triple != []) = true := by decide
