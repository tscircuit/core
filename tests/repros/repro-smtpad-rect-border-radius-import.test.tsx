import { beforeAll, expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import { type PcbSmtPad, pcb_smtpad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const pads: PcbSmtPad[] = ["rect", "rotated_rect"].map((shape, index) =>
  pcb_smtpad.parse({
    type: "pcb_smtpad",
    pcb_smtpad_id: `pcb_smtpad_${index}`,
    shape,
    x: index * 10 - 5,
    y: 0,
    width: 3,
    height: 2,
    layer: "top",
    ccw_rotation: 30,
    rect_border_radius: 0.5,
    port_hints: [String(index + 1)],
  }),
)

beforeAll(async () => {
  expect(pads).toMatchObject([
    { shape: "rect", rect_border_radius: 0.5 },
    { shape: "rotated_rect", rect_border_radius: 0.5 },
  ])
  circuit.add(
    <board width={24} height={10} schematicDisabled routingDisabled>
      {/* FootprintProp uses a legacy shape union; pads are schema-validated above. */}
      <chip name="U1" footprint={pads as FootprintProp} />
      <pcbnotetext
        text="Imported rect / rotated_rect: radius=0.5 mm"
        pcbY={3.5}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Both currently lose rect_border_radius"
        pcbY={-3.5}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_smtpad.list()).toMatchObject([
    { shape: "rect", width: 3, height: 2 },
    { shape: "rotated_rect", width: 3, height: 2, ccw_rotation: 30 },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing(
  "Circuit JSON footprints retain rect_border_radius on both rectangular shapes",
  () => {
    expect(circuit.db.pcb_smtpad.list()).toMatchObject([
      { shape: "rect", rect_border_radius: 0.5 },
      { shape: "rotated_rect", rect_border_radius: 0.5 },
    ])
  },
)
