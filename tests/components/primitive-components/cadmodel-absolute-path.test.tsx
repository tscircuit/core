import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import "lib/register-catalogue"

test("cadmodel primitive accepts absolute modelUrl", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance={1000}
        footprint="0402"
        cadModel={<cadmodel modelUrl="/mymodels/model.glb" pcbX={1} />}
      />
    </board>,
  )

  circuit.render()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0].model_glb_url).toBe("/mymodels/model.glb")
})
