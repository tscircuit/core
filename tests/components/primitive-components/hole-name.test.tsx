import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Hole component preserves name property in pcb_hole circuit-json", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <hole pcbX={-15} pcbY={0} diameter="3.2mm" name="H1" />
      <hole pcbX={15} pcbY={0} shape="rect" width="3mm" height="4mm" name="H2" />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list()
  expect(pcbHoles).toHaveLength(2)

  const circleHole = pcbHoles.find((h) => h.hole_shape === "circle")
  expect(circleHole).toBeDefined()
  expect((circleHole as any).name).toBe("H1")

  const rectHole = pcbHoles.find((h) => h.hole_shape === "rect")
  expect(rectHole).toBeDefined()
  expect((rectHole as any).name).toBe("H2")
})
