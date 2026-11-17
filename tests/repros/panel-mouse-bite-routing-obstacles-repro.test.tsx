import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Mouse-bite drills belong to the panel, so each board's autorouter never
// receives them as obstacles. On both boards, R1 and R2 sit near the top edge,
// under the top tab's drills; their trace must route around the drills.
test("board traces in a panel route around mouse-bite drills", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      width={60}
      height={40}
      layoutMode="grid"
      col={2}
      panelizationMethod="tab-routing"
    >
      <board name="B1" width={20} height={20}>
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
      <board name="B2" width={20} height={20}>
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
  ).toMatchInlineSnapshot(`[]`)
})
