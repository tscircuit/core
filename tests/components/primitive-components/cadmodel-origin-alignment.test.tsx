import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cadmodel preserves authored model origin alignment", async () => {
  const { circuit, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
  })
  const modelUrl = `${staticAssetsServerUrl}/models/C2889342.obj`

  circuit.add(
    <board width={20} height={12} routingDisabled>
      <resistor
        name="R_CHILD"
        resistance={1000}
        footprint="0402"
        pcbX={-3}
        cadModel={
          <cadmodel modelUrl={modelUrl} modelOriginAlignment="center" />
        }
      />
      <resistor
        name="R_OBJECT"
        resistance={1000}
        footprint="0402"
        pcbX={3}
        cadModel={{ objUrl: modelUrl, modelOriginAlignment: "center" }}
      />
    </board>,
  )
  circuit.render()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(2)
  for (const cadComponent of cadComponents) {
    expect(cadComponent.model_origin_alignment).toBe("center")
    expect(cadComponent.model_origin_position).toBeUndefined()
  }

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
