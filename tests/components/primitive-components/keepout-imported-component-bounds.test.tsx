import { expect, spyOn, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("component bounds rotate imported keepout-local dimensions only once without fetching", async () => {
  const { circuit } = getTestFixture()
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(async () => {
    throw new Error("Keepout rendering must not request external assets")
  })
  const footprint: AnyCircuitElement[] = [
    {
      type: "pcb_keepout",
      pcb_keepout_id: "",
      shape: "rect",
      center: { x: 0, y: 0 },
      width: 4,
      height: 2,
      layers: ["top"],
      allow_traces: false,
      allow_placements: true,
    },
  ]
  try {
    circuit.add(
      <board width={28} height={20} schematicDisabled autorouter="none">
        {(["top", "bottom"] as const).flatMap((layer, row) =>
          [0, 90, 45].map((rotation, column) => (
            <Fragment key={`${layer}${rotation}`}>
              <chip
                name={`J${layer}${rotation}`}
                pcbX={-9 + column * 9}
                pcbY={5 - row * 10}
                pcbRotation={rotation}
                layer={layer}
                cadModel={null}
                footprint={footprint}
              />
              <pcbnotetext
                text={`${layer} ${rotation}deg: body = keepout bounds`}
                pcbX={-9 + column * 9}
                pcbY={1 - row * 10}
                fontSize={0.5}
              />
            </Fragment>
          )),
        )}
      </board>,
    )
    await circuit.renderUntilSettled()
    for (const pcbComponent of circuit.db.pcb_component.list()) {
      const keepout = circuit.db.pcb_keepout
        .list()
        .find(
          (k) =>
            Math.abs(k.center.x - pcbComponent.center.x) < 1e-9 &&
            Math.abs(k.center.y - pcbComponent.center.y) < 1e-9,
        )!
      if (keepout.shape !== "rect") throw new Error("Expected rectangle")
      expect(pcbComponent.width).toBeCloseTo(keepout.width, 10)
      expect(pcbComponent.height).toBeCloseTo(keepout.height, 10)
    }
    expect(circuit.db.pcb_component.list()).toHaveLength(6)
    expect(fetchSpy).not.toHaveBeenCalled()
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  } finally {
    fetchSpy.mockRestore()
  }
})
