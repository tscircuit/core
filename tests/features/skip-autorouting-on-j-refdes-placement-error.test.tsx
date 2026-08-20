import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouting is skipped when a chip uses a J-prefixed refdes", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <chip
        name="J1"
        pcbX={-3}
        pinLabels={{ pin1: ["1"], pin2: ["2"] }}
        footprint="0402"
      />
      <chip
        name="U1"
        pcbX={3}
        pinLabels={{ pin1: ["1"], pin2: ["2"] }}
        footprint="0402"
      />
      <trace from=".J1 > .pin1" to=".U1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const placementErrors = circuit.db.pcb_placement_error.list()
  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()

  expect(placementErrors).toHaveLength(1)
  expect(placementErrors[0].message).toBe(
    'The "J" prefix is being used with a <chip />, try using it with a <connector /> or <jumper />',
  )
  expect(autoroutingStartCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0].message).toContain(
    "Autorouting was skipped because 1 PCB placement error was found",
  )
})
