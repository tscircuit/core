import { expect, spyOn, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  expectKeepoutMatchesEmittedPads,
  importedKeepoutFootprint,
} from "tests/fixtures/imported-keepout-transform-fixture"

test("component anchor placement moves imported keepouts with their owning pads", async () => {
  const { circuit } = getTestFixture()
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      async () => {
        throw new Error("Component placement must not request external assets")
      },
      { preconnect: globalThis.fetch.preconnect },
    ),
  )
  try {
    circuit.add(
      <board width={48} height={30} schematicDisabled autorouter="none">
        {(["top", "bottom"] as const).flatMap((layer, row) =>
          [0, 90, 45].map((rotation, column) => (
            <Fragment key={`${layer}${rotation}`}>
              <chip
                name={`J${layer}${rotation}`}
                pcbX={-18 + column * 16}
                pcbY={7 - row * 14}
                pcbPositionAnchor="top_left"
                pcbRotation={rotation}
                layer={layer}
                cadModel={null}
                footprint={importedKeepoutFootprint}
                pinLabels={{
                  pin1: "center",
                  pin2: "corner1",
                  pin3: "corner2",
                  pin4: "corner3",
                  pin5: "corner4",
                  pin6: "circle_center",
                }}
              />
              <pcbnotetext
                text={`${layer} ${rotation}deg: keepouts follow component anchor`}
                pcbX={-15 + column * 16}
                pcbY={2 - row * 14}
                fontSize={0.48}
              />
            </Fragment>
          )),
        )}
        <keepout shape="circle" radius={0.3} pcbY={14} />
        <pcbnotetext
          text="Unowned circle stays at (0,14)"
          pcbX={-7}
          pcbY={14}
          fontSize={0.4}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    for (const [row, layer] of (["top", "bottom"] as const).entries()) {
      for (const [column, rotation] of [0, 90, 45].entries()) {
        const source = circuit.db.source_component.getWhere({
          name: `J${layer}${rotation}`,
        })!
        const pcbComponent = circuit.db.pcb_component.getWhere({
          source_component_id: source.source_component_id,
        })!
        // This asymmetric footprint requires a nonzero anchor translation.
        expect(
          Math.hypot(
            pcbComponent.center.x - (-18 + column * 16),
            pcbComponent.center.y - (7 - row * 14),
          ),
        ).toBeGreaterThan(1)
        const ownedKeepouts = circuit.db.pcb_keepout
          .list()
          .filter(
            (keepout) =>
              keepout.pcb_component_id === pcbComponent.pcb_component_id,
          )
        expect(ownedKeepouts).toHaveLength(2)
        expectKeepoutMatchesEmittedPads(circuit, `J${layer}${rotation}`, layer)
      }
    }
    const boardKeepout = circuit.db.pcb_keepout
      .list()
      .find((keepout) => keepout.shape === "circle" && keepout.radius === 0.3)!
    expect(boardKeepout.pcb_component_id).toBeUndefined()
    expect(boardKeepout.center).toEqual({ x: 0, y: 14 })
    expect(fetchSpy).not.toHaveBeenCalled()
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  } finally {
    fetchSpy.mockRestore()
  }
})
