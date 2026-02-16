import { test, expect } from "bun:test"
import { getTestFixture } from "./fixtures/get-test-fixture"

test("chip with nested cadmodel should respect showAsTranslucentModel", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        cadModel={
          <cadmodel
            modelUrl="https://modelcdn.tscircuit.com/jscad_models/soic8.glb"
            showAsTranslucentModel
          />
        }
      />
    </board>,
  )

  circuit.render()

  const cadComponent = circuit.db.cad_component.list()[0]

  expect(cadComponent).toBeDefined()
  expect(cadComponent.show_as_translucent_model).toBe(true)
})
