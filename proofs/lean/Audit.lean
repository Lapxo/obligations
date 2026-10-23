import Obligations
import Lean

open Lean Elab Command

def permittedAxioms (names : Array Name) : Bool :=
  names.all fun name => #[`propext, `Classical.choice, `Quot.sound].contains name

#guard permittedAxioms #[]
#guard permittedAxioms #[`propext, `Classical.choice, `Quot.sound]
#guard !permittedAxioms #[`sorryAx]
#guard !permittedAxioms #[`unprovedClaim]

run_cmd do
  let env ← getEnv
  let mut checked := 0
  for (name, info) in env.constants.toList do
    if info.isTheorem && ([`Obligations, `Obligations047, `Obligations050].any (·.isPrefixOf name)) then
      let axioms ← liftTermElabM <| collectAxioms name
      unless permittedAxioms axioms do
        throwError "Forbidden axioms in {name}: {axioms}"
      logInfo m!"{name}: {axioms}"
      checked := checked + 1
  if checked == 0 then
    throwError "No mathematical theorems were audited"
  logInfo m!"Audited {checked} mathematical theorems"
