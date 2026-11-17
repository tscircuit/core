import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Panel mouse-bite drills belong to the panel, so each board's autorouter
// never receives them as obstacles. R1 and R2 sit near the top edge, under a
// tab's drills; their trace must route around the drills.
test("board traces route around panel mouse-bite drills", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel width={40} height={40} panelizationMethod="tab-routing">
      <board width={20} height={20}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-3}
          pcbY={9.3}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={3}
          pcbY={9.3}
          connections={{ pin1: ".R1 > .pin2" }}
        />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(
    circuit.db.pcb_trace_error.list().map((error) => error.message),
  ).toMatchInlineSnapshot(`
    [
      "Trace .R2 > .pin1 to .R1 > .pin2 is too close to non-plated hole unnamed hole (gap: 0.175000mm, required: 0.2mm)",
      "Trace .R2 > .pin1 to .R1 > .pin2 is too close to non-plated hole unnamed hole (gap: 0.175000mm, required: 0.2mm)",
      "Trace .R2 > .pin1 to .R1 > .pin2 is too close to non-plated hole unnamed hole (gap: 0.175000mm, required: 0.2mm)",
      "Trace .R2 > .pin1 to .R1 > .pin2 is too close to non-plated hole unnamed hole (gap: 0.175000mm, required: 0.2mm)",
    ]
  `)
})
