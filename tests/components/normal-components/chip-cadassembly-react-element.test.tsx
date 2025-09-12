import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "lib/register-catalogue"

it("chip with cadassembly cadmodel react element", async () => {
  const { circuit, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
  })

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        cadModel={
          <cadassembly>
            <cadmodel
              modelUrl={`${staticAssetsServerUrl}/models/C965799.obj`}
              pcbX={-2}
            />
            <cadmodel
              modelUrl={`${staticAssetsServerUrl}/models/C7428714.obj`}
              pcbX={2}
            />
          </cadassembly>
        }
      />
    </board>,
  )

  circuit.render()

  const cad = circuit.db.cad_component.list()
  expect(cad).toHaveLength(2)
  const xs = cad.map((c) => c.position.x).sort((a, b) => a - b)
  expect(xs[0]).toBeLessThan(0)
  expect(xs[1]).toBeGreaterThan(0)

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
