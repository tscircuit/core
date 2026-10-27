import { expect, test } from "bun:test"
import { assembly } from "lib"
import { ExtrudeLinear, Rectangle } from "jscad-fiber/model"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("section dimensions measure retained solid and clip native outline attachments", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart
        name="block"
        jscad={
          <ExtrudeLinear height={10} topOutlineName="rim">
            <Rectangle size={[40, 20]} />
          </ExtrudeLinear>
        }
      />
      <assembly.drawing.page size="iso_a4">
        <assembly.drawing.titleblock title="RETAINED SECTION EXTENTS / ORIGINAL 40 × 20 mm" />
        <assembly.drawing.partview
          name="section"
          displayName="X SECTION / KEEP GREATER THAN 15"
          partRef=".block"
          direction="z+"
          width={80}
          height={60}
          centerX={-60}
          centerY={30}
          section={{ axis: "x", offset: 15, keepSide: "greater" }}
        >
          <assembly.drawing.dimension name="retained-width" widthOfView />
          <assembly.drawing.dimension
            name="retained-rim"
            edgeRef=".block > .rim"
          />
        </assembly.drawing.partview>
        <assembly.drawing.partview
          name="uncut"
          displayName="UNCUT / FULL WIDTH"
          partRef=".block"
          direction="z+"
          width={80}
          height={60}
          centerX={50}
          centerY={30}
        >
          <assembly.drawing.dimension name="full-width" widthOfView />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.drawing_dimension_line
      .list()
      .map((line) => [line.name, line.text]),
  ).toEqual([
    ["retained-width", "5 mm"],
    ["retained-rim", "20 mm"],
    ["full-width", "40 mm"],
  ])
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
