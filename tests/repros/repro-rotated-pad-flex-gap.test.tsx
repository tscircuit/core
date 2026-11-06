import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("equivalent rotated pads get different PCB flex gaps", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })
  circuit.add(
    <board width={30} height={29} routingDisabled>
      {([true, false] as const).map((explicitShape, row) => (
        <group
          key={row}
          pcbFlex
          pcbFlexGap={1}
          pcbFlexDirection="row"
          pcbY={row === 0 ? 7 : -7}
        >
          {[1, 2].map((pinIndex) => (
            <chip
              name={`U${row}_${pinIndex}`}
              key={pinIndex}
              pcbRotation={explicitShape ? 45 : 0}
              footprint={
                <footprint>
                  {explicitShape ? (
                    <smtpad
                      shape="rotated_rect"
                      width={8}
                      height={1}
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
      <pcbnotetext
        text="rotated_rect + chip rotation: requested gap 1 mm"
        pcbY={13}
        fontSize={0.7}
      />
      <pcbnotetext
        text="Same copper using rect: gap 1 mm"
        pcbY={-1}
        fontSize={0.7}
      />
      <pcbnotetext text="Actual: 9 mm" pcbY={7} fontSize={0.65} />
      <pcbnotetext
        text="Both rows should have identical pad spacing"
        pcbY={-13}
        fontSize={0.75}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const [rotatedLeft, rotatedRight, rectLeft, rectRight] =
    circuit.db.pcb_smtpad.list()
  if (
    rotatedLeft.shape !== "rotated_rect" ||
    rotatedRight.shape !== "rotated_rect" ||
    rectLeft.shape !== "rect" ||
    rectRight.shape !== "rect"
  )
    throw new Error("Unexpected pad shapes")
  expect(rotatedLeft.ccw_rotation).toBe(90)
  expect(rotatedRight.ccw_rotation).toBe(90)
  expect(rotatedLeft.height).toBe(rectLeft.width)
  expect(rotatedLeft.width).toBe(rectLeft.height)
  // At 90 degrees, the rotated pad's local height is its board-space width.
  expect(
    rotatedRight.x -
      rotatedRight.height / 2 -
      (rotatedLeft.x + rotatedLeft.height / 2),
  ).toBeCloseTo(9)
  expect(
    rectRight.x - rectRight.width / 2 - (rectLeft.x + rectLeft.width / 2),
  ).toBeCloseTo(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 1000,
    showPcbNotes: true,
  })
})
