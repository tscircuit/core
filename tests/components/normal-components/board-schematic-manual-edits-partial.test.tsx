import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("one manual schematic placement keeps auto layout for siblings", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="30mm"
      height="30mm"
      manualEdits={{
        schematic_placements: [
          {
            selector: "R1",
            center: { x: 8, y: 8 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <resistor name="R2" resistance="10k" footprint="0402" />
      <resistor name="R3" resistance="10k" footprint="0402" />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".R3 > .pin1" />
    </board>,
  )

  circuit.render()

  const board = circuit.firstChild as any
  expect(board._getSchematicLayoutMode()).toBe("match-adapt")

  const getCenter = (name: string) =>
    circuit.db.schematic_component.getWhere({
      source_component_id: circuit.selectOne(`.${name}`)!.source_component_id!,
    })!.center

  // R1 stays fixed at its manual placement.
  const r1 = getCenter("R1")
  expect(r1.x).toBeCloseTo(8, 1)
  expect(r1.y).toBeCloseTo(8, 1)

  // R2 and R3 are auto-laid-out and do not overlap each other.
  const r2 = getCenter("R2")
  const r3 = getCenter("R3")
  const distance = Math.hypot(r2.x - r3.x, r2.y - r3.y)
  expect(distance).toBeGreaterThan(1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
