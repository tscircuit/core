import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated_rect and rotated_pill pads keep the requested pcbFlexGap under chip rotation", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })

  circuit.add(
    <board width={30} height={36} routingDisabled>
      <group pcbFlex pcbFlexGap={1} pcbFlexDirection="row" pcbY={10}>
        {[1, 2].map((index) => (
          <chip
            key={index}
            name={`ROTATED_RECT_${index}`}
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
        {[1, 2].map((index) => (
          <chip
            key={index}
            name={`RECT_${index}`}
            footprint={
              <footprint>
                <smtpad shape="rect" width={1} height={8} />
              </footprint>
            }
          />
        ))}
      </group>
      <group pcbFlex pcbFlexGap={1} pcbFlexDirection="row" pcbY={-10}>
        {[1, 2].map((index) => (
          <chip
            key={index}
            name={`ROTATED_PILL_${index}`}
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
      <pcbnotetext
        text="rotated_rect + chip rotation: gap 1 mm"
        pcbY={15.5}
        fontSize={0.7}
      />
      <pcbnotetext
        text="Same copper as rect: gap 1 mm"
        pcbY={5.5}
        fontSize={0.7}
      />
      <pcbnotetext
        text="rotated_pill + chip rotation: gap 1 mm"
        pcbY={-4.5}
        fontSize={0.7}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const [
    rotatedRectLeft,
    rotatedRectRight,
    rectLeft,
    rectRight,
    rotatedPillLeft,
    rotatedPillRight,
  ] = circuit.db.pcb_smtpad.list()

  if (
    rotatedRectLeft.shape !== "rotated_rect" ||
    rotatedRectRight.shape !== "rotated_rect" ||
    rectLeft.shape !== "rect" ||
    rectRight.shape !== "rect" ||
    rotatedPillLeft.shape !== "rotated_pill" ||
    rotatedPillRight.shape !== "rotated_pill"
  ) {
    throw new Error("Unexpected pad shapes")
  }

  // At 90 degrees the pad's local height spans the board-space X axis.
  expect(
    rotatedRectRight.x -
      rotatedRectRight.height / 2 -
      (rotatedRectLeft.x + rotatedRectLeft.height / 2),
  ).toBeCloseTo(1, 6)
  expect(
    rectRight.x - rectRight.width / 2 - (rectLeft.x + rectLeft.width / 2),
  ).toBeCloseTo(1, 6)
  expect(
    rotatedPillRight.x -
      rotatedPillRight.height / 2 -
      (rotatedPillLeft.x + rotatedPillLeft.height / 2),
  ).toBeCloseTo(1, 6)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})
