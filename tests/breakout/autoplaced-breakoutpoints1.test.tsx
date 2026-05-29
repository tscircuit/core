import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autoplaced breakout points created for cross-boundary traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <breakout name="B1" autorouter="auto" padding="0.7mm">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
        <capacitor
          name="C1"
          capacitance="1uF"
          footprint="0402"
          pcbX={2}
          pcbY={0}
        />
        {/* Internal trace — should NOT create a breakout point */}
        <trace from="R1.2" to="C1.1" />
      </breakout>
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      {/* Cross-boundary trace — should create an auto breakout point for R1.pin1 */}
      <trace from="R1.1" to="R2.1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // R1.pin1 crosses the boundary — should have exactly 1 auto-placed breakout point
  const breakoutPoints = circuit.db.pcb_breakout_point.list()
  expect(breakoutPoints).toHaveLength(1)
  expect(breakoutPoints[0].source_port_id).toBeDefined()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
