import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import "tests/fixtures/extend-expect-circuit-snapshot"
import glowPadCircuitJson from "./assets/glow-pad-mismatch-autorouter.circuit.json"

test("repro172: mismatch autorouter", async () => {
  await expect(glowPadCircuitJson as CircuitJson).toMatchPcbSnapshot(
    import.meta.path,
  )
})
