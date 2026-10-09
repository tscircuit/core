import { expect, test } from "bun:test"
import { CourtyardTestFootprint } from "tests/fixtures/courtyard-test-footprint"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPack uses explicit courtyards instead of larger footprint defaults", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} pcbPack pcbGap={0} routingDisabled>
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint={<CourtyardTestFootprint />}
      >
        <courtyardrect width={2} height={1} />
      </capacitor>
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint={<CourtyardTestFootprint />}
      >
        <courtyardrect width={2} height={1} />
      </capacitor>
      <pcbnotetext pcbY={3} text="Pack with 2 x 1mm overrides" fontSize={0.5} />
    </board>,
  )
  circuit.render()

  const rects = circuit.db.pcb_courtyard_rect.list()
  expect(rects).toHaveLength(2)
  expect(rects.every((rect) => rect.width === 2 && rect.height === 1)).toBe(
    true,
  )
  expect(circuit.db.pcb_courtyard_circle.list()).toHaveLength(0)
  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(0)
  const dx = Math.abs(rects[0].center.x - rects[1].center.x)
  const dy = Math.abs(rects[0].center.y - rects[1].center.y)
  // 6 x 4mm defaults would keep the centers at least 4mm apart.
  expect(Math.hypot(dx, dy)).toBeLessThan(4)
  expect(dx >= 2 - 1e-6 || dy >= 1 - 1e-6).toBe(true)
  expect(circuit.db.pcb_courtyard_overlap_error.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
