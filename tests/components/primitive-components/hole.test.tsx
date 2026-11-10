import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Hole component rendering", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <hole diameter="0.08in" pcbX={3} pcbY={1} />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list()

  expect(pcbHoles.length).toBe(1)
  expect((pcbHoles[0] as any).hole_diameter).toBeCloseTo(2.032)
  expect(pcbHoles[0].x).toBe(3)
  expect(pcbHoles[0].y).toBe(1)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})

test("Hole component supports holeDiameter alias and completes autorouting + copper pour without NaN bounds crash", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <hole name="H1" holeDiameter="3.2mm" pcbX={-5} pcbY={5} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0805"
        pcbX={-5}
        pcbY={-4}
        connections={{ pin1: "net.GND", pin2: "R2.pin1" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0805"
        pcbX={5}
        pcbY={-4}
        connections={{ pin2: "net.GND" }}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbHoles = circuit.db.pcb_hole.list()
  expect(pcbHoles.length).toBe(1)
  expect((pcbHoles[0] as any).hole_diameter).toBeCloseTo(3.2)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(1)
})

test("Circle Hole without diameter, holeDiameter, or radius records a clear component creation error and does not insert a corrupt pcb_hole", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <hole {...({ name: "H1", pcbX: 0, pcbY: 0 } as any)} />
    </board>,
  )
  circuit.render()

  expect(circuit.db.pcb_hole.list()).toHaveLength(0)
  const creationErrors =
    circuit.db.source_failed_to_create_component_error.list()
  expect(creationErrors).toHaveLength(1)
  expect(creationErrors[0].message).toMatch(/diameter|holeDiameter|radius/)
})
