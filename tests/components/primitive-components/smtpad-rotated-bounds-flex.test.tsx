import { expect, test } from "bun:test"
import { getAxisAlignedSizeFromRotatedRect } from "lib/utils/pcb/get-axis-aligned-size-from-rotated-rect"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated_rect and rotated_pill pads preserve exact PCB flex spacing under chip rotation", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })

  circuit.add(
    <board width={30} height={36} routingDisabled>
      <group pcbFlex pcbFlexGap={1} pcbFlexDirection="row" pcbY={10}>
        {[1, 2].map((pinIndex) => (
          <chip
            key={pinIndex}
            name={`ROT_RECT_${pinIndex}`}
            pcbRotation={45}
            footprint={
              <footprint>
                <smtpad
                  shape="rotated_rect"
                  width={8}
                  height={1}
                  ccwRotation={45}
                />
              </footprint>
            }
          />
        ))}
      </group>
      <group pcbFlex pcbFlexGap={1} pcbFlexDirection="row" pcbY={0}>
        {[1, 2].map((pinIndex) => (
          <chip
            key={pinIndex}
            name={`RECT_${pinIndex}`}
            footprint={
              <footprint>
                <smtpad shape="rect" width={1} height={8} />
              </footprint>
            }
          />
        ))}
      </group>
      <group pcbFlex pcbFlexGap={1} pcbFlexDirection="row" pcbY={-10}>
        {[1, 2].map((pinIndex) => (
          <chip
            key={pinIndex}
            name={`ROT_PILL_${pinIndex}`}
            pcbRotation={45}
            footprint={
              <footprint>
                <smtpad
                  shape="rotated_pill"
                  width={8}
                  height={1}
                  radius={0.5}
                  ccwRotation={45}
                />
              </footprint>
            }
          />
        ))}
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads).toHaveLength(6)

  const [
    rotRectLeft,
    rotRectRight,
    rectLeft,
    rectRight,
    rotPillLeft,
    rotPillRight,
  ] = pads

  if (
    rotRectLeft.shape !== "rotated_rect" ||
    rotRectRight.shape !== "rotated_rect" ||
    rectLeft.shape !== "rect" ||
    rectRight.shape !== "rect" ||
    rotPillLeft.shape !== "rotated_pill" ||
    rotPillRight.shape !== "rotated_pill"
  ) {
    throw new Error("Unexpected pad shapes")
  }

  expect(rotRectLeft.ccw_rotation).toBe(90)
  expect(rotPillLeft.ccw_rotation).toBe(90)

  const rotRectGap =
    rotRectRight.x -
    rotRectRight.height / 2 -
    (rotRectLeft.x + rotRectLeft.height / 2)
  const rectGap =
    rectRight.x - rectRight.width / 2 - (rectLeft.x + rectLeft.width / 2)
  const rotPillGap =
    rotPillRight.x -
    rotPillRight.height / 2 -
    (rotPillLeft.x + rotPillLeft.height / 2)

  expect(rotRectGap).toBeCloseTo(1, 6)
  expect(rectGap).toBeCloseTo(1, 6)
  expect(rotPillGap).toBeCloseTo(1, 6)
})

test("rotated_rect component bounds match emitted copper on top and bottom layers", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })

  circuit.add(
    <board width={40} height={24} routingDisabled>
      <chip
        name="TOP_CHIP"
        layer="top"
        pcbX={-10}
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
      <chip
        name="BOTTOM_CHIP"
        layer="bottom"
        pcbX={10}
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
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const component of circuit.db.pcb_component.list()) {
    const pad = circuit.db.pcb_smtpad
      .list()
      .find((p) => p.pcb_component_id === component.pcb_component_id)!
    if (pad.shape !== "rotated_rect") {
      throw new Error("Expected rotated_rect pad")
    }
    const expected = getAxisAlignedSizeFromRotatedRect({
      width: pad.width,
      height: pad.height,
      ccwRotationDegrees: pad.ccw_rotation,
    })
    expect(component.width).toBeCloseTo(expected.width, 6)
    expect(component.height).toBeCloseTo(expected.height, 6)
    expect(component.center.x).toBeCloseTo(pad.x, 6)
    expect(component.center.y).toBeCloseTo(pad.y, 6)
  }
})
