import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated_rect and rotated_pill pads preserve exact PCB flex gap when parent chip is rotated", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })
  circuit.add(
    <board width={30} height={36} routingDisabled>
      {([0, 1, 2] as const).map((row) => (
        <group
          key={row}
          pcbFlex
          pcbFlexGap={1}
          pcbFlexDirection="row"
          pcbY={row === 0 ? 11 : row === 1 ? 0 : -11}
        >
          {[1, 2].map((pinIndex) => (
            <chip
              name={`U${row}_${pinIndex}`}
              key={pinIndex}
              pcbRotation={row === 2 ? 0 : 45}
              footprint={
                <footprint>
                  {row === 0 ? (
                    <smtpad
                      shape="rotated_rect"
                      width={8}
                      height={1}
                      ccwRotation={45}
                    />
                  ) : row === 1 ? (
                    <smtpad
                      shape="rotated_pill"
                      width={8}
                      height={1}
                      radius={0.5}
                      ccwRotation={45}
                    />
                  ) : (
                    <smtpad shape="rect" width={1} height={8} />
                  )}
                </footprint>
              }
            />
          ))}
        </group>
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads).toHaveLength(6)
  const [
    rotatedRectLeft,
    rotatedRectRight,
    rotatedPillLeft,
    rotatedPillRight,
    rectLeft,
    rectRight,
  ] = pads

  if (
    rotatedRectLeft.shape !== "rotated_rect" ||
    rotatedRectRight.shape !== "rotated_rect" ||
    rotatedPillLeft.shape !== "rotated_pill" ||
    rotatedPillRight.shape !== "rotated_pill" ||
    rectLeft.shape !== "rect" ||
    rectRight.shape !== "rect"
  ) {
    throw new Error("Unexpected pad shapes")
  }

  expect(rotatedRectLeft.ccw_rotation).toBe(90)
  expect(rotatedRectRight.ccw_rotation).toBe(90)
  expect(rotatedPillLeft.ccw_rotation).toBe(90)
  expect(rotatedPillRight.ccw_rotation).toBe(90)

  for (const pcbComponent of circuit.db.pcb_component.list()) {
    expect(pcbComponent.width).toBeCloseTo(1)
    expect(pcbComponent.height).toBeCloseTo(8)
  }

  expect(
    rotatedRectRight.x -
      rotatedRectRight.height / 2 -
      (rotatedRectLeft.x + rotatedRectLeft.height / 2),
  ).toBeCloseTo(1)

  expect(
    rotatedPillRight.x -
      rotatedPillRight.height / 2 -
      (rotatedPillLeft.x + rotatedPillLeft.height / 2),
  ).toBeCloseTo(1)

  expect(
    rectRight.x - rectRight.width / 2 - (rectLeft.x + rectLeft.width / 2),
  ).toBeCloseTo(1)
})

test("bottom-layer rotated_rect pads compute exact PCB component bounds and flex spacing", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })
  circuit.add(
    <board width={20} height={20} routingDisabled>
      <group pcbFlex pcbFlexGap={1} pcbFlexDirection="row">
        {[1, 2].map((pinIndex) => (
          <chip
            name={`B${pinIndex}`}
            key={pinIndex}
            layer="bottom"
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
    </board>,
  )

  await circuit.renderUntilSettled()

  const [padLeft, padRight] = circuit.db.pcb_smtpad.list()
  if (padLeft?.shape !== "rotated_rect" || padRight?.shape !== "rotated_rect") {
    throw new Error("Expected rotated_rect pads on bottom layer")
  }

  expect(padLeft.layer).toBe("bottom")
  expect(padLeft.ccw_rotation).toBe(180)
  expect(padRight.ccw_rotation).toBe(180)

  for (const pcbComponent of circuit.db.pcb_component.list()) {
    expect(pcbComponent.width).toBeCloseTo(8)
    expect(pcbComponent.height).toBeCloseTo(1)
  }

  expect(
    padRight.x - padRight.width / 2 - (padLeft.x + padLeft.width / 2),
  ).toBeCloseTo(1)
})
