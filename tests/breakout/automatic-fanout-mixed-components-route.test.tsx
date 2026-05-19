import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fanout automatically adds breakout points for every PCB port in the group", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm">
      <fanout name="MIXED_FANOUT" autorouter="auto" padding="1mm">
        <chip name="U1" footprint="soic8" pcbX={-5} pcbY={0} />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={2}
          pcbY={1}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={5}
          pcbY={1}
        />
        <trace from="R1.2" to="C1.1" />
      </fanout>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_port.list()).toHaveLength(12)
  expect(circuit.db.pcb_breakout_point.list()).toHaveLength(12)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
