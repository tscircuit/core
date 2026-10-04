import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { SmtPad } from "lib/components/primitive-components/SmtPad"

test("polygon paste follows margins, rotation, layer and layout movement", async () => {
  const { circuit } = getTestFixture()
  const margins = [undefined, 0, -0.2, 0.2, -3, 0]
  circuit.add(
    <board width={32} height={18}>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        margins.map((margin, column) => (
          <chip
            key={`${layer}-${column}`}
            name={`U${row * margins.length + column + 1}`}
            layer={layer}
            pcbX={column * 5 - 12.5}
            pcbY={row * 7 - 3.5}
            pcbRotation={(column % 4) * 90}
            pinLabels={{ 1: "PAD" }}
            footprint={
              <footprint>
                <smtpad
                  shape="polygon"
                  points={[
                    { x: -1.5, y: -1 },
                    { x: 1.5, y: -1 },
                    { x: 1.5, y: 0 },
                    { x: -0.5, y: 1 },
                    { x: -1.5, y: 0 },
                  ]}
                  solderPasteMargin={margin}
                  coveredWithSolderMask={column === 5}
                  portHints={["pin1"]}
                />
              </footprint>
            }
          />
        )),
      )}
      <pcbnotetext
        text="Polygon paste: default / zero / inset / outset / removed / covered"
        pcbY={7.5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const pads = circuit.db.pcb_smtpad.list()
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(8)
  for (const [padIndex, pad] of pads.entries()) {
    const paste = circuit.db.pcb_solder_paste
      .list()
      .find((paste) => paste.pcb_smtpad_id === pad.pcb_smtpad_id)
    if (padIndex % margins.length >= 4) {
      expect(paste).toBeUndefined()
      continue
    }
    expect(paste?.layer).toBe(pad.layer)
    expect(paste?.shape).toBe("polygon")
    if (
      padIndex % margins.length === 1 &&
      pad.shape === "polygon" &&
      paste?.shape === "polygon"
    ) {
      expect(paste.points).toEqual(pad.points)
    }
  }
  const pad = circuit.selectOne(".U2 smtpad") as SmtPad
  const pasteBefore = circuit.db.pcb_solder_paste
    .list()
    .find((paste) => paste.pcb_smtpad_id === pad.pcb_smtpad_id)!
  if (pasteBefore.shape !== "polygon") throw new Error("Expected polygon paste")
  const pointsBefore = pasteBefore.points
  pad._moveCircuitJsonElements({ deltaX: 0.5, deltaY: -0.25 })
  const pasteAfter = circuit.db.pcb_solder_paste.get(
    pasteBefore.pcb_solder_paste_id,
  )!
  if (pasteAfter.shape !== "polygon") throw new Error("Expected polygon paste")
  expect(pasteAfter.points).toEqual(
    pointsBefore.map(({ x, y }) => ({ x: x + 0.5, y: y - 0.25 })),
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
