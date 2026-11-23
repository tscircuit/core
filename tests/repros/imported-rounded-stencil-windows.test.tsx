import { expect, test } from "bun:test"
import { footprintProp } from "@tscircuit/props"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import type { PcbSolderPastePill } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reproduce the loss of rounded stencil windows on footprint import", async () => {
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
  const renderedPaste = circuit.db.pcb_solder_paste.list()
  expect(windows).toHaveLength(9)
  // Current output: the nine input windows are replaced by one square.
  expect(renderedPaste).toHaveLength(1)
  expect(renderedPaste[0]).toMatchObject({ shape: "rect", x: 0, y: 0 })
  const board = circuit.db.pcb_board.list()
  const panels = [
    { title: "Input", paste: windows },
    { title: "Core output", paste: renderedPaste },
  ].map(({ title, paste }) =>
    stackSvgsVertically([
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="40"><rect width="300" height="40" fill="white"/><text x="150" y="26" text-anchor="middle" font-family="sans-serif" font-size="17">${title} · openings: ${paste.length}</text></svg>`,
      convertCircuitJsonToPcbSvg([...board, ...paste], {
        width: 300,
        height: 240,
        showSolderPaste: true,
      }),
    ]),
  )
  await expect(stackSvgsHorizontally(panels)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
