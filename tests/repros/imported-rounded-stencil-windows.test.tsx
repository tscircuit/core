import { beforeAll, expect, test } from "bun:test"
import { footprintProp } from "@tscircuit/props"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import type { PcbSolderPaste, PcbSolderPastePill } from "circuit-json"
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
        footprint={footprintProp.parse([
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
        ])}
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

test("compare the stencil before and after footprint import", async () => {
  const board = circuit.db.pcb_board.list()
  const panel = (title: string, paste: PcbSolderPaste[]) =>
    stackSvgsVertically([
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="40"><rect width="300" height="40" fill="white"/><text x="150" y="26" text-anchor="middle" font-family="sans-serif" font-size="17">${title} · openings: ${paste.length}</text></svg>`,
      convertCircuitJsonToPcbSvg([...board, ...paste], {
        width: 300,
        height: 240,
        showSolderPaste: true,
      }),
    ])
  const comparison = stackSvgsHorizontally([
    panel("Input", windows),
    panel("Core output", circuit.db.pcb_solder_paste.list()),
  ])
  await expect(comparison).toMatchSvgSnapshot(import.meta.path)
})
