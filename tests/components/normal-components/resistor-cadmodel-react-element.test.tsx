import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "lib/register-catalogue"

it("resistor with cadmodel react element", async () => {
  const { circuit, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance={1000}
        footprint="0402"
        cadModel={
          <cadmodel
            modelUrl={`${staticAssetsServerUrl}/models/C2889342.obj`}
            pcbX={1}
          />
        }
      />
    </board>,
  )

  circuit.render()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0].model_obj_url).toBe(
    `${staticAssetsServerUrl}/models/C2889342.obj`,
  )
  expect(cadComponents[0].position.x).toBeCloseTo(1)

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
