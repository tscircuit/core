import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyPackOutput } from "lib/components/primitive-components/Group/Group_doInitialPcbLayoutPack/applyPackOutput"

test("pack-applied rotation propagates to pcb_plated_hole ccw_rotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <platedhole
              shape="pill"
              outerWidth="1.2mm"
              outerHeight="2.0mm"
              holeWidth="0.8mm"
              holeHeight="1.6mm"
              portHints={["1"]}
              pcbX="0mm"
              pcbY="0mm"
            />
          </footprint>
        }
        pcbX="0mm"
        pcbY="0mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const comp = circuit.db.pcb_component.list()[0]
  const holeBefore = circuit.db.pcb_plated_hole.list()[0] as any

  expect(comp.rotation).toBe(0)
  expect(holeBefore.ccw_rotation).toBe(0)
  ;(circuit as any).source_group_id =
    circuit.db.source_group.list()[0].source_group_id
  const packOutput = {
    components: [
      {
        componentId: comp.pcb_component_id,
        center: { x: 10, y: 10 },
        ccwRotationDegrees: 90,
      },
    ],
  }

  applyPackOutput(circuit as any, packOutput as any, {}, packOutput as any)

  const compAfter = circuit.db.pcb_component.list()[0]
  const holeAfter = circuit.db.pcb_plated_hole.list()[0] as any

  expect(compAfter.rotation).toBe(90)
  expect(holeAfter.ccw_rotation).toBe(90)
})

test("pack-applied rotation propagates to rotated_pill_hole_with_rect_pad", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <platedhole
              shape="pill"
              rectPad
              outerWidth="1.2mm"
              outerHeight="2.0mm"
              holeWidth="0.8mm"
              holeHeight="1.6mm"
              portHints={["1"]}
              pcbX="0mm"
              pcbY="0mm"
            />
          </footprint>
        }
        pcbX="0mm"
        pcbY="0mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const comp = circuit.db.pcb_component.list()[0]
  const holeBefore = circuit.db.pcb_plated_hole.list()[0] as any

  expect(comp.rotation).toBe(0)
  expect(holeBefore.hole_ccw_rotation).toBe(0)
  expect(holeBefore.rect_ccw_rotation).toBe(0)
  ;(circuit as any).source_group_id =
    circuit.db.source_group.list()[0].source_group_id
  const packOutput = {
    components: [
      {
        componentId: comp.pcb_component_id,
        center: { x: 10, y: 10 },
        ccwRotationDegrees: 90,
      },
    ],
  }

  applyPackOutput(circuit as any, packOutput as any, {}, packOutput as any)

  const compAfter = circuit.db.pcb_component.list()[0]
  const holeAfter = circuit.db.pcb_plated_hole.list()[0] as any

  expect(compAfter.rotation).toBe(90)
  expect(holeAfter.hole_ccw_rotation).toBe(90)
  expect(holeAfter.rect_ccw_rotation).toBe(90)
})
