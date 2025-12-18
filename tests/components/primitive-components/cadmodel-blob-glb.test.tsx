import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cadmodel handles blob glb url via fragment extension", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance={1000}
        footprint="0402"
        cadModel={
          <cadmodel
            modelUrl="blob:http://localhost:3000/123#ext=glb"
            pcbX={1}
          />
        }
      />
    </board>,
  )

  circuit.render()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0].model_glb_url).toBe(
    "blob:http://localhost:3000/123#ext=glb",
  )
})
