import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { AutoroutingPhaseIo } from "tests/fixtures/create-autorouting-phase-io-stack"
import "tests/fixtures/extend-expect-autorouting-phases-snapshot"
import "tests/fixtures/extend-expect-circuit-snapshot"
import glowPadCircuitJson from "./assets/glow-pad-mismatch-autorouter.circuit.json"

test("repro172: mismatch autorouter", async () => {
  const circuitJson = glowPadCircuitJson as CircuitJson
  const subcircuitId = circuitJson.find(
    (element) => element.type === "source_group",
  )!.subcircuit_id
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    subcircuit_id: subcircuitId,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const autoroutingPhaseIoStack: AutoroutingPhaseIo[] = [
    { startSimpleRouteJson: simpleRouteJson },
  ]

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "repro172-mismatch-autorouter-autorouting-srj",
    { getCircuitJson: () => circuitJson },
  )
})
