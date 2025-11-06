import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouted traces use default minTraceWidth regardless of explicit thickness", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="15mm">
      <group name="test-group" autorouter="auto-local">
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbX={-5}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="10k"
          footprint="0402"
          pcbX={5}
          pcbY={0}
        />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" thickness="0.5mm" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace).toBeDefined()
  if (!pcbTrace) throw new Error("Expected trace to be routed")

  // Current behavior: autorouted traces use minTraceWidth (0.15) regardless of explicit thickness
  // This demonstrates the current limitation that explicit trace thickness is ignored in autorouting
  expect(
    pcbTrace.route
      .filter((segment) => segment.route_type === "wire")
      .every((segment) => segment.width === 0.15),
  ).toBe(true)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
