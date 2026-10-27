import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("drawing dimensions use selected board geometry and relative view placement", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board name="carrier" width={40} height={25} thickness={1.6}>
        <hole diameter={3} pcbX={-15} pcbY={-7} />
        <hole diameter={3} pcbX={15} pcbY={7} />
      </board>
      <assembly.drawing.page size="iso_a4">
        <assembly.drawing.titleblock title="CARRIER / 40 × 25 × 1.6 mm" />
        <assembly.drawing.partview
          name="side"
          displayName="BOARD THICKNESS"
          partRef=".carrier"
          direction="y-"
          width={65}
          height={35}
          belowRef=".plan"
          centerX={-40}
        >
          <assembly.drawing.dimension heightOfView />
        </assembly.drawing.partview>
        <assembly.drawing.partview
          name="plan"
          displayName="BOARD OUTLINE"
          partRef=".carrier"
          direction="z+"
          width={65}
          height={50}
          centerY={45}
          centerX={-40}
        >
          <assembly.drawing.dimension widthOfView />
          <assembly.drawing.dimension heightOfView />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.drawing_dimension_line.list().map((line) => line.text),
  ).toEqual(["1.6 mm", "40 mm", "25 mm"])
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
