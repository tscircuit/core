import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("minimum viable trace width in constrained space with manual routing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {/* Components with minimal spacing */}
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-0.5}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={0.5}
        pcbY={0}
      />
      {/* Small but reasonable trace width */}
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        thickness="0.1mm"
        pcbPath={[]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace).toBeDefined()
  if (!pcbTrace) throw new Error("Expected trace to be routed")

  // Verify the trace width is preserved
  expect(
    pcbTrace.route
      .filter((segment) => segment.route_type === "wire")
      .every((segment) => segment.width === 0.1),
  ).toBe(true)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})