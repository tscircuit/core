import { expect, test } from "bun:test"

import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated through-hole slots retain copper without stencil paste", async () => {
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
  expect(solderPaste).toHaveLength(0)
  for (const hole of platedHoles) {
    expect(hole).toMatchObject({
      shape: "pill",
      outer_width: 1.5,
      outer_height: 2.2,
      hole_width: 0.9,
      hole_height: 1.5,
      layers: ["top", "bottom"],
    })
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
