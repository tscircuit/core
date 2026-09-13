import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("phase none overrides board basic despite placement errors", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  let calls = 0
  circuit.add(
    <board
      preflightRoutingCheckPolicy="basic"
      width="12mm"
      height="8mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: createBasicAutorouter(async () => {
          calls++
          return []
        }),
      }}
    >
      <autoroutingphase phaseIndex={0} preflightRoutingCheckPolicy="none" />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.7}
        text="NONE: ATTEMPT ROUTING DESPITE PLACEMENT"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={-0.45}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={0.45}
      />
      <trace routingPhaseIndex={0} from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const autoroutingErrors = circuit.db.pcb_preflight_routing_error.list()
  expect(autoroutingStartCount).toBe(1)
  expect(calls).toBe(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_footprint_overlap_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_courtyard_overlap_error.list().length).toBeGreaterThan(
    0,
  )
  expect(autoroutingErrors).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showCourtyards: true,
  })
})
