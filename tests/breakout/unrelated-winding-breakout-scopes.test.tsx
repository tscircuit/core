import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unrelated automatic breakout cohorts solve independently", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="18mm">
      <breakout name="A_LEFT" pcbX={-9} pcbY={4} padding="1mm">
        <resistor name="RA1" resistance="1k" footprint="0402" />
      </breakout>
      <breakout name="A_RIGHT" pcbX={-2} pcbY={4} padding="1mm">
        <resistor name="RA2" resistance="1k" footprint="0402" />
      </breakout>
      <breakout name="B_LEFT" pcbX={2} pcbY={-4} padding="1mm">
        <resistor name="RB1" resistance="1k" footprint="0402" />
      </breakout>
      <breakout name="B_RIGHT" pcbX={9} pcbY={-4} padding="1mm">
        <resistor name="RB2" resistance="1k" footprint="0402" />
      </breakout>
      <trace name="A_SIGNAL" from="RA1.pin1" to="RA2.pin1" />
      <trace name="B_SIGNAL" from="RB1.pin1" to="RB2.pin1" />
      <pcbnotetext
        text="Two unrelated winding breakout cohorts"
        pcbY={7}
        fontSize="0.4mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_breakout_point.list()).toHaveLength(4)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
