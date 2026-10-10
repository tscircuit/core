import { expect, spyOn, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  expectKeepoutMatchesEmittedPads,
  KeepoutTransformChip,
} from "tests/fixtures/imported-keepout-transform-fixture"

test("group anchor placement moves imported circle and rectangle keepouts with their pads", async () => {
  const { circuit } = getTestFixture()
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(async () => {
    throw new Error("Keepout placement must not request external assets")
  })
  try {
    circuit.add(
      <board width={40} height={26} schematicDisabled autorouter="none">
        {(["top", "bottom"] as const).flatMap((layer, row) =>
          [0, 90].map((rotation, column) => (
            <Fragment key={`${layer}${rotation}`}>
              <group
                name={`G${layer}${rotation}`}
                pcbX={-14 + column * 20}
                pcbY={9 - row * 13}
                pcbPositionAnchor="top_left"
              >
                <KeepoutTransformChip
                  name={`J${layer}${rotation}`}
                  pcbX={0}
                  pcbRotation={rotation}
                  layer={layer}
                />
              </group>
              <pcbnotetext
                text={`${layer} ${rotation}deg: moved with group anchor`}
                pcbX={-10 + column * 20}
                pcbY={2 - row * 13}
                fontSize={0.55}
              />
            </Fragment>
          )),
        )}
      </board>,
    )
    await circuit.renderUntilSettled()
    for (const layer of ["top", "bottom"] as const) {
      for (const rotation of [0, 90]) {
        const group = circuit.db.pcb_group.getWhere({
          name: `G${layer}${rotation}`,
        })!
        expect(group.center.x - group.width! / 2).toBeCloseTo(
          group.anchor_position!.x,
          10,
        )
        expect(group.center.y + group.height! / 2).toBeCloseTo(
          group.anchor_position!.y,
          10,
        )
        // top_left alignment requires translation in both axes; marker-pad
        // comparisons below must therefore exercise emitted DB movement.
        expect(
          Math.abs(group.center.x - group.anchor_position!.x),
        ).toBeGreaterThan(1)
        expect(
          Math.abs(group.center.y - group.anchor_position!.y),
        ).toBeGreaterThan(1)
        expectKeepoutMatchesEmittedPads(circuit, `J${layer}${rotation}`, layer)
      }
    }
    expect(fetchSpy).not.toHaveBeenCalled()
    await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      showPcbGroups: true,
    })
  } finally {
    fetchSpy.mockRestore()
  }
})
