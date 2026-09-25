import { expect, test } from "bun:test"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported rectangular pad radii survive the circuit json round trip", async () => {
  const { circuit } = getTestFixture()
  const footprint = new Footprint({})
  const importedComponents = createComponentsFromCircuitJson(
    { componentName: "U1", componentRotation: "0" },
    [
      {
        type: "pcb_smtpad",
        shape: "rect",
        pcb_smtpad_id: "pcb_smtpad_0",
        x: -3,
        y: 1,
        width: 2,
        height: 1,
        layer: "top",
        corner_radius: 0.2,
        port_hints: ["pin1"],
      },
      {
        type: "pcb_smtpad",
        shape: "rect",
        pcb_smtpad_id: "pcb_smtpad_1",
        x: 0,
        y: 1,
        width: 2,
        height: 1,
        layer: "top",
        rect_border_radius: 0.2,
        port_hints: ["pin2"],
      },
      {
        type: "pcb_smtpad",
        shape: "rect",
        pcb_smtpad_id: "pcb_smtpad_2",
        x: 3,
        y: 1,
        width: 2,
        height: 1,
        layer: "top",
        corner_radius: 0,
        rect_border_radius: 0.3,
        port_hints: ["pin3"],
      },
      {
        type: "pcb_smtpad",
        shape: "rotated_rect",
        pcb_smtpad_id: "pcb_smtpad_3",
        x: -3,
        y: -1,
        width: 2,
        height: 1,
        layer: "top",
        ccw_rotation: 45,
        corner_radius: 0.2,
        rect_border_radius: 0.3,
        port_hints: ["pin4"],
      },
      {
        type: "pcb_smtpad",
        shape: "rotated_rect",
        pcb_smtpad_id: "pcb_smtpad_4",
        x: 0,
        y: -1,
        width: 2,
        height: 1,
        layer: "top",
        ccw_rotation: 45,
        rect_border_radius: 0.2,
        port_hints: ["pin5"],
      },
      {
        type: "pcb_smtpad",
        shape: "rotated_rect",
        pcb_smtpad_id: "pcb_smtpad_5",
        x: 3,
        y: -1,
        width: 2,
        height: 1,
        layer: "top",
        ccw_rotation: 45,
        port_hints: ["pin6"],
      },
    ],
  )
  for (const primitive of importedComponents) {
    footprint.add(primitive)
  }
  circuit.add(
    <board width={11} height={7}>
      <chip name="U1" />
      <pcbnotetext
        text="rect: corner 0.2 / legacy 0.2 / explicit 0"
        pcbY={2.6}
        fontSize={0.3}
      />
      <pcbnotetext
        text="rotated: corner 0.2 / legacy 0.2 / unset"
        pcbY={-2.6}
        fontSize={0.3}
      />
    </board>,
  )
  circuit.selectOne("chip")!.add(footprint)
  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_smtpad.list()).toMatchObject([
    { shape: "rect", corner_radius: 0.2 },
    { shape: "rect", corner_radius: 0.2 },
    { shape: "rect", corner_radius: 0 },
    { shape: "rotated_rect", ccw_rotation: 45, corner_radius: 0.2 },
    { shape: "rotated_rect", ccw_rotation: 45, corner_radius: 0.2 },
    { shape: "rotated_rect", ccw_rotation: 45, corner_radius: undefined },
  ])
})
