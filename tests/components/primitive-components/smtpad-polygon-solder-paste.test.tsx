import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { SmtPad } from "lib/components/primitive-components/SmtPad"

test("polygon paste follows margin, layer, rotation and layout movement", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={28} height={18}>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        [0, 90, 180, 270].map((rotation, column) => (
          <chip
            key={`${layer}-${rotation}`}
            name={`U${row * 4 + column + 1}`}
            layer={layer}
            pcbX={column * 6 - 9}
            pcbY={row * 8 - 4}
            pcbRotation={rotation}
            footprint={
              <footprint>
                <smtpad
                  shape="polygon"
                  points={[
                    { x: 0, y: 0 },
                    { x: 3, y: 0 },
                    { x: 3, y: 1 },
                    { x: 0, y: 2 },
                  ]}
                  solderPasteMargin={0}
                  portHints={["pin1"]}
                />
              </footprint>
            }
          />
        )),
      )}
      <pcbnotetext
        text="Polygon paste: zero margin, both layers, 0/90/180/270 degrees"
        pcbY={7.5}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const pad of circuit.db.pcb_smtpad.list()) {
    const paste = circuit.db.pcb_solder_paste
      .list()
      .find((paste) => paste.pcb_smtpad_id === pad.pcb_smtpad_id)!
    expect(paste.shape).toBe("polygon")
    expect(paste.layer).toBe(pad.layer)
    if (pad.shape !== "polygon" || paste.shape !== "polygon")
      throw new Error("Expected polygon pad and paste")
    expect(paste.points).toHaveLength(pad.points.length)
    for (const point of pad.points) {
      expect(
        paste.points.some(
          (pastePoint) =>
            Math.abs(point.x - pastePoint.x) < 0.00001 &&
            Math.abs(point.y - pastePoint.y) < 0.00001,
        ),
      ).toBe(true)
    }
  }
  const pad = circuit.selectOne("smtpad")
  if (!(pad instanceof SmtPad)) throw new Error("Expected SmtPad")
  const before = circuit.db.pcb_solder_paste.list()[0]!
  if (before.shape !== "polygon") throw new Error("Expected polygon paste")
  const beforePoints = structuredClone(before.points)
  pad._moveCircuitJsonElements({ deltaX: 1.2, deltaY: -0.4 })
  const moved = circuit.db.pcb_solder_paste.get(before.pcb_solder_paste_id)!
  if (moved.shape !== "polygon") throw new Error("Expected polygon paste")
  expect(moved.points).toEqual(
    beforePoints.map((point) => ({ x: point.x + 1.2, y: point.y - 0.4 })),
  )
  const movedCopper = circuit.db.pcb_smtpad.get(pad.pcb_smtpad_id!)!
  if (movedCopper.shape !== "polygon")
    throw new Error("Expected polygon copper")
  const movedPort = circuit.db.pcb_port.get(movedCopper.pcb_port_id!)!
  expect(movedPort.x).toBeCloseTo(
    (Math.min(...movedCopper.points.map((point) => point.x)) +
      Math.max(...movedCopper.points.map((point) => point.x))) /
      2,
  )
  expect(movedPort.y).toBeCloseTo(
    (Math.min(...movedCopper.points.map((point) => point.y)) +
      Math.max(...movedCopper.points.map((point) => point.y))) /
      2,
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
    layer: "top",
  })
})
