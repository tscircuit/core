import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("partview dimensions inherit geometry and measure model mm in multiple directions", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="fixture">
      <assembly.printedpart
        name="housing"
        jscad={
          <jscad.subtract>
            <jscad.cuboid size={[48, 24, 12]} />
            <jscad.cylinder radius={4} height={14} />
          </jscad.subtract>
        }
      />
      <assembly.part
        name="unselected"
        cadModel={{ jscad: { type: "cuboid", size: [100, 100, 100] } }}
      />
      <assembly.drawing.page name="housing-dimensions" size="iso_a4">
        <assembly.drawing.titleblock title="Housing — dimensions in mm" />
        <assembly.drawing.partview
          partRef=".housing"
          name="plan"
          displayName="PLAN"
          direction="z+"
          width={100}
          height={70}
          centerX={-60}
          centerY={25}
        >
          <assembly.drawing.dimension name="width" widthOfView />
          <assembly.drawing.dimension name="height" heightOfView />
        </assembly.drawing.partview>
        <assembly.drawing.partview
          partRef=".housing"
          name="end"
          displayName="END"
          direction="x+"
          width={60}
          height={50}
          centerX={65}
          centerY={25}
        >
          <assembly.drawing.dimension widthOfView />
          <assembly.drawing.dimension heightOfView />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const lines = circuit.db.drawing_dimension_line.list()
  expect(lines.map((line) => line.text)).toEqual(["48", "24", "24", "12"])
  expect(Math.abs(lines[2]!.end.x - lines[2]!.start.x)).not.toBe(24)
  const json = structuredClone(circuit.getCircuitJson())
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
  circuit.render()
  expect(circuit.getCircuitJson()).toEqual(json)
})
