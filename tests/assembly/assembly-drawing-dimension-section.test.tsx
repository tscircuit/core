import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("view dimensions measure retained section geometry using the renderer camera", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="fixture">
      <assembly.printedpart
        name="housing"
        jscad={<jscad.cuboid size={[40, 24, 12]} />}
      />
      <assembly.drawing.page name="half-housing" size="iso_a4">
        <assembly.drawing.titleblock title="Half housing — retained section dimensions (mm)" />
        <assembly.drawing.partview
          partRef=".housing"
          direction="z+"
          displayName="SECTION A–A"
          width={90}
          height={70}
          section={{ axis: "x", offset: 0, keepSide: "less", hatchSpacing: 1 }}
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
  ).toEqual(["20", "24"])
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
