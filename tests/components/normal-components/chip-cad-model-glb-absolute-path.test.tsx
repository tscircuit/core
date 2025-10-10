import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import "lib/register-catalogue"

test("chip cadModel glbUrl accepts absolute path", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
        cadModel={{
          glbUrl: "/mymodels/model.glb",
        }}
      />
    </board>,
  )

  project.render()

  const cadComponent = project.db.cad_component.list()[0]
  expect(cadComponent.model_glb_url).toBe("/mymodels/model.glb")
})
