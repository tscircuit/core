import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cadmodel primitive forwards stepUrl to model_step_url", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance={1000}
        footprint="0402"
        cadModel={
          <cadmodel modelUrl="/models/res.step" stepUrl="/models/res.step" />
        }
      />
    </board>,
  )

  circuit.render()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0].model_step_url).toBe("/models/res.step")
})
