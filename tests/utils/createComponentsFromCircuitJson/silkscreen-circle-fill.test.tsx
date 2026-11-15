import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported silkscreen circles keep filled and outline artwork", async () => {
  const { circuit } = getTestFixture()
  const footprint = new Footprint({})
  const circleArtwork: AnyCircuitElement[] = [false, true].map(
    (isFilled, column) => ({
      type: "pcb_silkscreen_circle",
      pcb_silkscreen_circle_id: `pcb_silkscreen_circle_${column}`,
      pcb_component_id: "pcb_component_0",
      layer: "top",
      center: { x: column * 12 - 6, y: 0 },
      radius: 3,
      stroke_width: 0.25,
      is_filled: isFilled,
    }),
  )
  for (const primitive of createComponentsFromCircuitJson(
    { componentName: "U1", componentRotation: "0" },
    circleArtwork,
  )) {
    footprint.add(primitive)
  }
  circuit.add(
    <board width={30} height={18} pcbLayout={{ layoutMode: "none" }}>
      <pcbnotetext text="IMPORTED: OUTLINE / SOLID" pcbY={6} fontSize={1} />
      <chip name="U1" pcbX={0} pcbY={0} />
    </board>,
  )
  circuit.selectOne("chip")!.add(footprint)
  circuit.render()
  expect(
    circuit.db.pcb_silkscreen_circle
      .list()
      .map((circle) => circle.is_filled ?? false),
  ).toEqual([false, true])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
