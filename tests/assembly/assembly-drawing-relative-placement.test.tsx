import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("all four relative references resolve forward declarations and unequal viewport sizes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part
        name="housing"
        cadModel={{ jscad: { type: "cuboid", size: [24, 16, 10] } }}
      />
      <assembly.drawing.page width={297} height={210}>
        <assembly.drawing.titleblock title="Relative view placement — forward references" />
        <assembly.drawing.partview
          partRef=".housing"
          name="left"
          displayName="LEFT"
          direction="x-"
          width={50}
          height={40}
          leftOfRef=".plan"
          centerY={20}
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="right"
          displayName="RIGHT"
          direction="x+"
          width={70}
          height={40}
          rightOfRef=".plan"
          centerY={20}
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="above"
          displayName="ABOVE"
          direction="y+"
          width={60}
          height={30}
          aboveRef=".plan"
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="below"
          displayName="BELOW"
          direction="y-"
          width={60}
          height={20}
          belowRef=".plan"
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="plan"
          displayName="PLAN"
          direction="z+"
          width={60}
          height={40}
          centerY={20}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const centers = Object.fromEntries(
    circuit.db.drawing_part_view.list().map((view) => [view.name, view.center]),
  )
  expect(centers).toEqual({
    left: { x: -55, y: 20 },
    right: { x: 65, y: 20 },
    above: { x: 0, y: 55 },
    below: { x: 0, y: -10 },
    plan: { x: 0, y: 20 },
  })
  const relative = circuit.selectOne(".left")!
  expect(relative._parsedProps.centerX).toBeUndefined()
  expect(relative.props.leftOfRef).toBe(".plan")
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
