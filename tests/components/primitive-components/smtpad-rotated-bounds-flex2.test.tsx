import { expect, test } from "bun:test"
import { getAxisAlignedSizeFromRotatedRect } from "lib/utils/pcb/get-axis-aligned-size-from-rotated-rect"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated_rect pad component bounds match emitted copper on top and bottom layers", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })

  circuit.add(
    <board width={40} height={24} routingDisabled>
      {(["top", "bottom"] as const).map((layer, index) => (
        <chip
          key={layer}
          name={`${layer.toUpperCase()}_CHIP`}
          layer={layer}
          pcbX={index === 0 ? -10 : 10}
          pcbRotation={15}
          footprint={
            <footprint>
              <smtpad
                shape="rotated_rect"
                pcbX={1}
                pcbY={-0.5}
                width={6}
                height={1.2}
                ccwRotation={30}
              />
            </footprint>
          }
        />
      ))}
      <pcbnotetext
        text="top: component bounds == pad bounds"
        pcbX={-10}
        pcbY={8}
        fontSize={0.7}
      />
      <pcbnotetext
        text="bottom: component bounds == pad bounds"
        pcbX={10}
        pcbY={8}
        fontSize={0.7}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const component of circuit.db.pcb_component.list()) {
    const pad = circuit.db.pcb_smtpad
      .list()
      .find(
        (candidate) =>
          candidate.pcb_component_id === component.pcb_component_id,
      )
    if (pad?.shape !== "rotated_rect") throw new Error("Expected rotated_rect")

    const padBounds = getAxisAlignedSizeFromRotatedRect({
      width: pad.width,
      height: pad.height,
      ccwRotationDegrees: pad.ccw_rotation,
    })
    expect(component.width).toBeCloseTo(padBounds.width, 6)
    expect(component.height).toBeCloseTo(padBounds.height, 6)
    expect(component.center.x).toBeCloseTo(pad.x, 6)
    expect(component.center.y).toBeCloseTo(pad.y, 6)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})
