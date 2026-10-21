import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("offset polygon pad bounds match emitted copper on both PCB layers", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={60} height={30} routingDisabled>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        [0, 45, 90, 180, 270].map((ccwRotationDegrees, column) => (
          <chip
            key={`${layer}-${ccwRotationDegrees}`}
            name={`${layer}_${ccwRotationDegrees}`}
            layer={layer}
            pcbRotation={ccwRotationDegrees}
            pcbX={column * 11 - 22}
            pcbY={row === 0 ? 7 : -7}
            footprint={
              <footprint>
                <smtpad
                  shape="polygon"
                  pcbX={0.5}
                  pcbY={-0.5}
                  points={[
                    { x: 1, y: 1 },
                    { x: 3, y: 1 },
                    { x: 3, y: 2 },
                  ]}
                />
                <silkscreentext
                  text={`${layer} ${ccwRotationDegrees}deg`}
                  pcbY={-2}
                  fontSize={0.6}
                />
              </footprint>
            }
          />
        )),
      )}
    </board>,
  )
  circuit.render()
  for (const component of circuit.db.pcb_component.list()) {
    const pad = circuit.db.pcb_smtpad
      .list()
      .find((pad) => pad.pcb_component_id === component.pcb_component_id)!
    if (pad.shape !== "polygon") throw new Error("Expected a polygon pad")
    const xs = pad.points.map((p) => p.x)
    const ys = pad.points.map((p) => p.y)
    expect(component.center.x - component.width / 2).toBeCloseTo(
      Math.min(...xs),
      6,
    )
    expect(component.center.x + component.width / 2).toBeCloseTo(
      Math.max(...xs),
      6,
    )
    expect(component.center.y - component.height / 2).toBeCloseTo(
      Math.min(...ys),
      6,
    )
    expect(component.center.y + component.height / 2).toBeCloseTo(
      Math.max(...ys),
      6,
    )
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
