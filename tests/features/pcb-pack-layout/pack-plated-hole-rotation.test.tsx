import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyPackOutput } from "lib/components/primitive-components/Group/Group_doInitialPcbLayoutPack/applyPackOutput"
import type { PackOutput } from "calculate-packing"

test("applyPackOutput propagates rotation to pcb_plated_hole elements", async () => {
  const { circuit } = getTestFixture()

  let groupRef: any
  circuit.add(
    <board width="50mm" height="50mm">
      <group ref={(ref) => (groupRef = ref)}>
        <chip
          name="U1"
          pcbX={0}
          pcbY={0}
          footprint={
            <footprint>
              <platedhole
                name="H1"
                shape="pill"
                outerWidth={1.2}
                outerHeight={2.0}
                holeWidth={0.8}
                holeHeight={1.6}
                pcbX={0}
                pcbY={0}
              />
              <platedhole
                name="H2"
                shape="circular_hole_with_rect_pad"
                holeDiameter={1.0}
                rectPadWidth={2.0}
                rectPadHeight={1.2}
                holeOffsetX={0.2}
                holeOffsetY={0}
                pcbX={3}
                pcbY={0}
              />
              <platedhole
                name="H3"
                shape="pill_hole_with_rect_pad"
                holeWidth={0.8}
                holeHeight={1.6}
                rectPadWidth={2.0}
                rectPadHeight={1.2}
                pcbX={-3}
                pcbY={0}
              />
            </footprint>
          }
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "U1" })!
      .source_component_id,
  })!

  const packOutput: PackOutput = {
    components: [
      {
        componentId: pcbComponent.pcb_component_id,
        center: { x: 5, y: 5 },
        width: 10,
        height: 10,
        ccwRotationDegrees: 90,
      },
    ],
  }

  const initialPackOutput: PackOutput = {
    components: [
      {
        componentId: pcbComponent.pcb_component_id,
        center: { x: 0, y: 0 },
        width: 10,
        height: 10,
        ccwRotationDegrees: 0,
      },
    ],
  }

  applyPackOutput(groupRef, packOutput, {}, initialPackOutput)

  const h1 = circuit.db.pcb_plated_hole.getWhere({
    pcb_component_id: pcbComponent.pcb_component_id,
    shape: "pill",
  }) as any
  expect(h1).toBeDefined()
  expect(h1.ccw_rotation).toBe(90)

  const h2 = circuit.db.pcb_plated_hole.getWhere({
    pcb_component_id: pcbComponent.pcb_component_id,
    shape: "circular_hole_with_rect_pad",
  }) as any
  expect(h2).toBeDefined()
  expect(h2.rect_ccw_rotation).toBe(90)
  expect(h2.hole_offset_x).toBeCloseTo(0)
  expect(h2.hole_offset_y).toBeCloseTo(0.2)

  const h3 = circuit.db.pcb_plated_hole.getWhere({
    pcb_component_id: pcbComponent.pcb_component_id,
    shape: "rotated_pill_hole_with_rect_pad",
  }) as any
  expect(h3).toBeDefined()
  expect(h3.hole_ccw_rotation).toBe(90)
  expect(h3.rect_ccw_rotation).toBe(90)
})

test("applyPackOutput propagates rotation to cluster members and compounds with initial rotation", async () => {
  const { circuit } = getTestFixture()

  let groupRef: any
  circuit.add(
    <board width="50mm" height="50mm">
      <group ref={(ref) => (groupRef = ref)}>
        <chip
          name="U1"
          pcbX={0}
          pcbY={0}
          pcbRotation={45}
          footprint={
            <footprint>
              <platedhole
                name="H1"
                shape="pill"
                outerWidth={1.2}
                outerHeight={2.0}
                holeWidth={0.8}
                holeHeight={1.6}
                pcbX={0}
                pcbY={0}
              />
            </footprint>
          }
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "U1" })!
      .source_component_id,
  })!

  const packOutput: PackOutput = {
    components: [
      {
        componentId: "cluster1",
        center: { x: 5, y: 5 },
        width: 10,
        height: 10,
        ccwRotationDegrees: 90,
      },
    ],
  }

  const initialPackOutput: PackOutput = {
    components: [
      {
        componentId: "cluster1",
        center: { x: 0, y: 0 },
        width: 10,
        height: 10,
        ccwRotationDegrees: 0,
      },
    ],
  }

  const clusterMap = {
    cluster1: {
      componentIds: [pcbComponent.pcb_component_id],
      relativeCenters: {
        [pcbComponent.pcb_component_id]: { x: 0, y: 0 },
      },
    },
  }

  applyPackOutput(groupRef, packOutput, clusterMap as any, initialPackOutput)

  const h1 = circuit.db.pcb_plated_hole.getWhere({
    pcb_component_id: pcbComponent.pcb_component_id,
  }) as any
  expect(h1).toBeDefined()
  // initial 45 deg + pack 90 deg = 135 deg
  expect(h1.ccw_rotation).toBe(135)
})
