import { expect, test } from "bun:test"
import type { PackOutput } from "calculate-packing"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { applyPackOutput } from "lib/components/primitive-components/Group/Group_doInitialPcbLayoutPack/applyPackOutput"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("packing rotates oval/pill centers and axes together", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={20} routingDisabled schematicDisabled>
      <group name="G1">
        <chip
          name="U1"
          pcbX={0}
          pcbY={0}
          footprint={
            <footprint>
              <silkscreenoval
                radiusX={3}
                radiusY={1}
                pcbX={-4}
                pcbRotation={25}
              />
              <silkscreenpill width={6} height={2} pcbX={4} pcbRotation={-35} />
            </footprint>
          }
        />
      </group>
      <pcbnotetext
        text="Pack output: center (3, 2), turn 90deg"
        pcbY={-8}
        fontSize={0.55}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const group = circuit.selectOne(".G1") as Group
  const component = circuit.db.pcb_component.list()[0]
  const initial: PackOutput = {
    components: [
      {
        componentId: component.pcb_component_id,
        center: component.center,
        ccwRotationOffset: 0,
        pads: [],
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }
  const output: PackOutput = {
    ...initial,
    components: [
      {
        ...initial.components[0],
        center: { x: 3, y: 2 },
        ccwRotationOffset: 90,
        ccwRotationDegrees: 90,
      },
    ],
  }
  applyPackOutput(group, output, {}, initial)
  const [oval] = circuit.db.pcb_silkscreen_oval.list()
  const [pill] = circuit.db.pcb_silkscreen_pill.list()
  expect(oval.center.x).toBeCloseTo(3, 6)
  expect(oval.center.y).toBeCloseTo(-2, 6)
  expect(pill.center.x).toBeCloseTo(3, 6)
  expect(pill.center.y).toBeCloseTo(6, 6)
  expect(oval.ccw_rotation).toBeCloseTo(115, 6)
  expect(pill.ccw_rotation).toBeCloseTo(55, 6)
  expect(component.rotation).toBeCloseTo(90, 6)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
