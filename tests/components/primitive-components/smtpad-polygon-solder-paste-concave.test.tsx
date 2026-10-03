import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { SmtPad } from "lib/components/primitive-components/SmtPad"

test("concave polygon paste preserves cutouts and split apertures during movement", () => {
  const { circuit } = getTestFixture()
  const points = [
    { x: -3, y: -2 },
    { x: -1, y: -2 },
    { x: -1, y: -0.1 },
    { x: 1, y: -0.1 },
    { x: 1, y: -2 },
    { x: 3, y: -2 },
    { x: 3, y: 2 },
    { x: 1, y: 2 },
    { x: 1, y: 0.1 },
    { x: -1, y: 0.1 },
    { x: -1, y: 2 },
    { x: -3, y: 2 },
  ]
  circuit.add(
    <board width={10} height={8}>
      <smtpad
        shape="polygon"
        points={points.toReversed()}
        portHints={[]}
        solderPasteMargin={-0.2}
      />
      <pcbnotetext
        text="Concave pad: erosion creates two polygon apertures"
        pcbY={3.4}
        fontSize={0.25}
      />
    </board>,
  )
  circuit.render()
  const before = structuredClone(circuit.db.pcb_solder_paste.list())
  expect(before).toHaveLength(2)
  for (const paste of before) {
    if (paste.shape !== "polygon") throw new Error("Expected polygon paste")
    expect(paste.points.every((point) => Math.abs(point.x) >= 1.19)).toBe(true)
  }
  const pad = circuit.selectOne("smtpad")
  if (!(pad instanceof SmtPad)) throw new Error("Expected SmtPad")
  pad._setPositionFromLayout({ x: 0.5, y: -0.5 })
  for (const paste of before) {
    if (paste.shape !== "polygon") throw new Error("Expected polygon paste")
    const moved = circuit.db.pcb_solder_paste.get(paste.pcb_solder_paste_id)!
    if (moved.shape !== "polygon") throw new Error("Expected polygon paste")
    expect(moved.points).toEqual(
      paste.points.map((point) => ({ x: point.x + 0.5, y: point.y - 0.5 })),
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
