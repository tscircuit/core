import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  expectKeepoutMatchesEmittedPads,
  importedKeepoutFootprint,
} from "tests/fixtures/imported-keepout-transform-fixture"

test("group packing moves owned keepouts together with their component pads", async () => {
  const { circuit } = getTestFixture()
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      async () => {
        throw new Error("Component packing must not request external assets")
      },
      { preconnect: globalThis.fetch.preconnect },
    ),
  )
  try {
    circuit.add(
      <board width={40} height={24} schematicDisabled autorouter="none">
        {(["top", "bottom"] as const).map((layer, column) => (
          <group
            key={layer}
            name={`G${layer}`}
            pcbX={-10 + column * 20}
            pcbPack
            pcbGap={1}
          >
            {[0, 90].map((rotation) => (
              <chip
                key={rotation}
                name={`J${layer}${rotation}`}
                layer={layer}
                cadModel={null}
                pcbRotation={rotation}
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
            ))}
          </group>
        ))}
        <pcbnotetext
          pcbX={-10}
          pcbY={-9}
          fontSize={0.55}
          text="Top: packed keepouts follow their pads"
        />
        <pcbnotetext
          pcbX={10}
          pcbY={-9}
          fontSize={0.55}
          text="Bottom: packed keepouts follow their pads"
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const components = circuit.db.pcb_component.list()
    expect(components).toHaveLength(4)
    expect(
      components.every((component) => component.position_mode === "packed"),
    ).toBe(true)
    expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
    // Every unpositioned chip starts at its group origin. At least one per
    // group must move to separate initially coincident physical footprints.
    expect(
      components.filter(
        (component) =>
          Math.hypot(
            component.center.x - (component.layer === "top" ? -10 : 10),
            component.center.y,
          ) > 1,
      ).length,
    ).toBeGreaterThanOrEqual(2)
    for (const layer of ["top", "bottom"] as const) {
      for (const rotation of [0, 90]) {
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
