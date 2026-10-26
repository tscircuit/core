import { beforeAll, expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import { type PcbSmtPad, pcb_smtpad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const margins = {
  soldermask_margin_left: 0,
  soldermask_margin_top: 0.1,
  soldermask_margin_right: -0.05,
  soldermask_margin_bottom: 0.2,
}
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
    port_hints: [String(index + 1)],
    ...margins,
  }),
)

beforeAll(async () => {
  expect(pads).toMatchObject([
    { shape: "rect", ...margins },
    { shape: "rotated_rect", ...margins },
  ])
  circuit.add(
    <board width={24} height={10} schematicDisabled routingDisabled>
      {/* FootprintProp uses a legacy shape union; pads are schema-validated above. */}
      <chip name="U1" footprint={pads as FootprintProp} />
      <pcbnotetext
        text="Imported per-side mask: rect / rotated_rect"
        pcbY={3.5}
        fontSize={0.6}
      />
      <pcbnotetext
        text="L=0 T=0.1 R=-0.05 B=0.2 mm are lost"
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
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})

test.failing(
  "Circuit JSON footprints retain all four directional soldermask margins",
  () => {
    expect(circuit.db.pcb_smtpad.list()).toMatchObject([
      { shape: "rect", ...margins },
      { shape: "rotated_rect", ...margins },
    ])
  },
)
