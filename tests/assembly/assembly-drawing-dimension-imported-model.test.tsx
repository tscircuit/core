import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dimensioned views reject imported model files", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part
        name="imported"
        cadModel={{ glbUrl: "https://example.com/imported-part.glb" }}
      />
      <assembly.drawing.page size="iso_a4">
        <assembly.drawing.partview
          name="plan"
          partRef=".imported"
          direction="z+"
          width={65}
          height={60}
        >
          <assembly.drawing.dimension widthOfView />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  // Dimensions are measured from jscad geometry; imported files need loaders
  // that core doesn't bundle.
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Part view "plan" could not resolve model geometry for dimensions: model https://example.com/imported-part.glb cannot be loaded for drawing dimensions',
  )
})
