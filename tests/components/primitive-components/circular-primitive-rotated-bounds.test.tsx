import { expect, test } from "bun:test"
import { doPcbPrimitivesOverlapBeforeRender } from "lib/components/primitive-components/Port/pcbPrimitiveOverlapBeforeRender"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("circular primitive bounds keep their diameter under parent rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={72} height={38} routingDisabled>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        [0, 45, 90, 180, 270].map((ccwRotationDegrees, column) => (
          <chip
            key={`${layer}_${ccwRotationDegrees}`}
            name={`${layer}_${ccwRotationDegrees}`}
            layer={layer}
            pcbX={column * 14 - 28}
            pcbY={row === 0 ? 8 : -8}
            pcbRotation={ccwRotationDegrees}
            footprint={
              <footprint>
                <smtpad
                  name="circle"
                  shape="circle"
                  radius={1}
                  pcbX={-3}
                  pcbY={2}
                />
                <platedhole
                  name="plated"
                  shape="circle"
                  outerDiameter={2}
                  holeDiameter={1}
                  pcbY={2}
                />
                <hole name="hole" diameter={2} pcbX={3} pcbY={2} />
                <via
                  name="via"
                  outerDiameter={2}
                  holeDiameter={1}
                  fromLayer="top"
                  toLayer="bottom"
                  pcbY={-2}
                />
                <silkscreentext
                  text={`${layer} ${ccwRotationDegrees}deg`}
                  pcbY={-4}
                  fontSize={0.6}
                />
              </footprint>
            }
          />
        )),
      )}
      <chip
        name="overlap_circle"
        pcbRotation={45}
        footprint={<smtpad name="round" shape="circle" radius={1} />}
      />
      <chip
        name="neighbor"
        pcbX={1.3}
        footprint={
          <smtpad name="square" shape="rect" width={0.2} height={0.2} />
        }
      />
      <pcbnotetext
        text="2 mm circles stay 2 mm; center pads have a 0.2 mm gap"
        pcbY={-17}
        fontSize={0.8}
      />
    </board>,
  )
  circuit.render()

  for (const primitive of circuit.selectAll("smtpad, platedhole, hole, via")) {
    if (primitive.name === "square") continue
    const bounds = primitive._getPcbBoundsBeforeLayout()
    expect(bounds.right - bounds.left).toBeCloseTo(2, 6)
    expect(bounds.top - bounds.bottom).toBeCloseTo(2, 6)
  }

  // Emitted centers include the parent rotation, translation, and layer flip.
  for (const pad of circuit.db.pcb_smtpad.list()) {
    if (pad.shape !== "circle") continue
    const chip = circuit
      .selectAll("chip")
      .find((chip) => chip.pcb_component_id === pad.pcb_component_id)!
    const bounds = chip.selectOne("smtpad")!._getPcbBoundsBeforeLayout()
    expect((bounds.left + bounds.right) / 2).toBeCloseTo(pad.x, 6)
    expect((bounds.top + bounds.bottom) / 2).toBeCloseTo(pad.y, 6)
  }

  expect(
    doPcbPrimitivesOverlapBeforeRender(
      circuit.selectOne(".overlap_circle > .round")!,
      circuit.selectOne(".neighbor > .square")!,
    ),
  ).toBe(false)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
