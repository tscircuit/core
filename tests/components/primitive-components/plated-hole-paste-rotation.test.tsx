import { expect, test } from "bun:test"
import { pcb_solder_paste } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pill paste follows transformed holes on both outer layers", () => {
  const { circuit } = getTestFixture()
  const rotationsDegrees = [0, 90, 180, 270]
  circuit.add(
    <board width={24} height={14} routingDisabled>
      {(["top", "bottom"] as const).flatMap((layer) =>
        rotationsDegrees.map((rotationDegrees, rotationIndex) => (
          <chip
            key={`${layer}_${rotationDegrees}`}
            name={`${layer}_${rotationDegrees}`}
            layer={layer}
            pcbX={rotationIndex * 5 - 7.5}
            pcbY={layer === "top" ? 3 : -3}
            pcbRotation={rotationDegrees}
            footprint={
              <footprint>
                <platedhole
                  shape="pill"
                  outerWidth={1.5}
                  outerHeight={2.2}
                  holeWidth={0.9}
                  holeHeight={1.5}
                />
              </footprint>
            }
          />
        )),
      )}
      <pcbnotetext
        text="0 / 90 / 180 / 270 deg: top above, bottom below"
        pcbY={6}
        fontSize={0.5}
      />
    </board>,
  )
  circuit.render()
  const platedHoles = circuit.db.pcb_plated_hole.list()
  const solderPaste = circuit.db.pcb_solder_paste.list()
  expect(platedHoles).toHaveLength(8)
  expect(solderPaste).toHaveLength(16)
  for (const hole of platedHoles) {
    if (hole.shape !== "pill") throw new Error("Expected pill hole")
    const pasteOnHole = solderPaste.filter(
      (paste) =>
        "x" in paste &&
        "y" in paste &&
        paste.x === hole.x &&
        paste.y === hole.y,
    )
    expect(pasteOnHole.map((paste) => paste.layer).sort()).toEqual([
      "bottom",
      "top",
    ])
    for (const paste of pasteOnHole) {
      pcb_solder_paste.parse(paste)
      if (paste.shape !== "rotated_pill") throw new Error("Expected pill paste")
      expect(paste.ccw_rotation).toBe(hole.ccw_rotation)
      expect(paste.width).toBe(1.5)
      expect(paste.height).toBe(2.2)
      expect(paste.radius).toBe(0.75)
    }
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
