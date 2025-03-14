import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("group routing with auto-local autorouter", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" autorouter="auto-local">
      <group name="ParentGroup">
        <group name="ChildGroup1">
          <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
          <resistor
            name="R1"
            pcbX={-5}
            pcbY={0}
            resistance={100}
            footprint="0402"
          />
          <trace from=".U1 > .pin1" to=".R1 > .pin1" />
        </group>
        <group name="ChildGroup2">
          <chip name="U2" footprint="soic8" pcbX={5} pcbY={8} />
          <resistor
            name="R2"
            pcbX={-5}
            pcbY={8}
            resistance={100}
            footprint="0402"
          />
          <trace from=".U2 > .pin1" to=".R2 > .pin1" />
        </group>
      </group>
    </board>,
  )

  // Render the circuit and wait for autorouting to complete
  await circuit.renderUntilSettled()

  // Get the circuit JSON and filter for autorouting results
  const circuitJson = circuit.getCircuitJson()
  const pcbTraceErrors = circuitJson.filter(
    (el) => el.type === "pcb_trace_error",
  )

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
  expect(pcbTraceErrors.length).toBe(0)
})
