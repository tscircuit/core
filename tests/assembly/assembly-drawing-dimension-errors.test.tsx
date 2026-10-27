import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dimensions reject misplaced children and unresolved model refs without partial lines", async () => {
  const { circuit: misplaced } = getTestFixture()
  misplaced.add(<assembly.drawing.dimension widthOfView />)
  expect(() => misplaced.render()).toThrow("must belong to a part view")
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="fixture">
      <assembly.printedpart
        name="housing"
        jscad={<jscad.cuboid size={[24, 12, 6]} />}
      />
      <assembly.drawing.page name="invalid-dimensions" size="iso_a4">
        <assembly.drawing.partview
          partRef=".housing"
          direction="z+"
          width={80}
          height={60}
        >
          <assembly.drawing.dimension widthOfView />
          <assembly.drawing.dimension edgeRef=".missing_outline" />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'edgeRef ".missing_outline" was not found',
  )
  expect(circuit.db.drawing_dimension_line.list()).toHaveLength(0)
  const { circuit: ambiguous } = getTestFixture()
  ambiguous.add(
    <assembly.device name="fixture">
      <assembly.subassembly name="pair">
        {["left", "right"].map((name) => (
          <assembly.printedpart
            key={name}
            name={name}
            jscad={
              <jscad.extrudeLinear height={4} topOutlineName="rim">
                <jscad.rectangle size={[20, 12]} />
              </jscad.extrudeLinear>
            }
          />
        ))}
      </assembly.subassembly>
      <assembly.drawing.page name="ambiguous-outline" size="iso_a4">
        <assembly.drawing.partview
          partRef=".pair"
          direction="z+"
          width={80}
          height={60}
        >
          <assembly.drawing.dimension edgeRef=".rim" />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await expect(ambiguous.renderUntilSettled()).rejects.toThrow(
    'edgeRef ".rim" is ambiguous',
  )
})
