import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("packed group keepout centers follow pads on both sides at all quarter turns", async () => {
  const { circuit } = getTestFixture()
  const layers = ["top", "bottom"] as const
  const rotations = [0, 90, 180, 270] as const
  circuit.add(
    <board width="80mm" height="60mm" pcbPack pcbPackGap="2mm" routingDisabled>
      <pcbnotetext
        text="CIRCLE KEEPOUTS FOLLOW PADS: TOP/BOTTOM AND 0/90/180/270"
        pcbY={25}
        fontSize={0.7}
      />
      {layers.flatMap((layer) =>
        rotations.map((angle) => (
          <group
            key={`${layer}_${angle}`}
            name={`G_${layer}_${angle}`}
            pcbRotation={angle}
          >
            <chip
              name={`U_${layer}_${angle}`}
              layer={layer}
              footprint={
                <footprint>
                  <smtpad
                    shape="circle"
                    radius={0.3}
                    pcbX={1}
                    pcbY={0.4}
                    portHints={["1"]}
                  />
                </footprint>
              }
            />
            <keepout
              shape="circle"
              radius="0.45mm"
              pcbX={layer === "top" ? 1 : -1}
              pcbY={0.4}
              layers={["top", "bottom"]}
              allowPlacements
              allowTraces
            />
          </group>
        )),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()

  let movedGroups = 0
  for (const layer of layers) {
    for (const angle of rotations) {
      const group = circuit.db.pcb_group.getWhere({
        name: `G_${layer}_${angle}`,
      })!
      const source = circuit.db.source_component.getWhere({
        name: `U_${layer}_${angle}`,
      })!
      const component = circuit.db.pcb_component.getWhere({
        source_component_id: source.source_component_id,
      })!
      const pad = circuit.db.pcb_smtpad
        .list()
        .find(
          (candidate) =>
            candidate.pcb_component_id === component.pcb_component_id,
        )!
      const keepout = circuit.db.pcb_keepout
        .list()
        .find((candidate) => candidate.pcb_group_id === group.pcb_group_id)!
      if (pad.shape !== "circle") throw new Error("Expected a circular pad")
      if (keepout.shape !== "circle")
        throw new Error("Expected a circular keepout")
      // Compare the emitted positions, including each group rotation and side.
      expect(keepout.center.x).toBeCloseTo(pad.x, 5)
      expect(keepout.center.y).toBeCloseTo(pad.y, 5)
      if (Math.hypot(component.center.x, component.center.y) > 0.1)
        movedGroups++
    }
  }
  expect(movedGroups).toBeGreaterThan(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
