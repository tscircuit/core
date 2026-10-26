import { beforeAll, expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import { type PcbSmtPad, pcb_smtpad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const pads: PcbSmtPad[] = [-0.1, 0, 0.1].map((margin, index) =>
  pcb_smtpad.parse({
    type: "pcb_smtpad",
    pcb_smtpad_id: `pcb_smtpad_${index}`,
    shape: "rect",
    x: index * 7 - 7,
    y: 0,
    width: 2,
    height: 1,
    layer: "top",
    solderpaste_margin: margin,
    port_hints: [String(index + 1)],
  }),
)

beforeAll(async () => {
  expect(pads.map((pad) => pad.solderpaste_margin)).toEqual([-0.1, 0, 0.1])
  // A footprint containing pad records only must regenerate its apertures
  // from solderpaste_margin; no explicit pcb_solder_paste records override it.
  circuit.add(
    <board width={28} height={10} schematicDisabled routingDisabled>
      {/* FootprintProp uses a legacy shape union; pads are schema-validated above. */}
      <chip name="U1" footprint={pads as FootprintProp} />
      <pcbnotetext
        text="Imported 2 x 1 mm pads: margins -0.1 / 0 / +0.1"
        pcbY={3.5}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Expected paste: 1.8x0.8 / 2x1 / 2.2x1.2"
        pcbY={-2.5}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Actual: all use the default 1.4 x 0.7 aperture"
        pcbY={-4}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_smtpad.list()).toMatchObject(
    pads.map(() => ({ shape: "rect", width: 2, height: 1 })),
  )
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(3)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})

test.failing(
  "imported solderpaste_margin preserves metadata and regenerates the correct aperture",
  () => {
    expect(
      circuit.db.pcb_smtpad.list().map((pad) => {
        const paste = circuit.db.pcb_solder_paste.getWhere({
          pcb_smtpad_id: pad.pcb_smtpad_id,
        })!
        return {
          margin: pad.solderpaste_margin,
          width: "width" in paste ? paste.width : undefined,
          height: "height" in paste ? paste.height : undefined,
        }
      }),
    ).toEqual([
      { margin: -0.1, width: 1.8, height: 0.8 },
      { margin: 0, width: 2, height: 1 },
      { margin: 0.1, width: 2.2, height: 1.2 },
    ])
  },
)
