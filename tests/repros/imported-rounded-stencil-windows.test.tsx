import { beforeAll, expect, test } from "bun:test"
import type { PcbSolderPastePill } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

// ESP32-C3FH4X exposed pad and standalone apertures from its converted footprint.
const offsets = [-1.22, 0, 1.22]
const windows = offsets.flatMap((x) =>
  offsets.map(
    (y): PcbSolderPastePill => ({
      type: "pcb_solder_paste",
      pcb_solder_paste_id: `paste_${x}_${y}`,
      shape: "pill",
      layer: "top",
      x,
      y,
      width: 0.98,
      height: 0.98,
      radius: 0.245,
    }),
  ),
)

beforeAll(async () => {
  circuit.add(
    <board width={6} height={6} routingDisabled schematicDisabled>
      <chip
        name="U30"
        footprint={[
          {
            type: "pcb_smtpad",
            pcb_smtpad_id: "exposed_pad",
            shape: "rect",
            layer: "top",
            x: 0,
            y: 0,
            width: 3.65,
            height: 3.65,
            port_hints: ["33"],
          },
          ...windows,
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(1)
})

test.failing(
  "an imported footprint preserves its nine rounded stencil windows",
  () => {
    const paste = circuit.db.pcb_solder_paste.list()
    expect(paste).toHaveLength(windows.length)
    for (const { pcb_solder_paste_id, ...geometry } of windows) {
      expect(paste).toContainEqual(expect.objectContaining(geometry))
    }
  },
)
