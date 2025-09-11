import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "lib/register-catalogue"

it("resistor with cadmodel react element", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance={1000}
        footprint="0402"
        cadModel={
          <cadmodel
            modelUrl="https://modelcdn.tscircuit.com/easyeda_models/download.obj?pn=C2889342"
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
    "https://modelcdn.tscircuit.com/easyeda_models/download.obj?pn=C2889342&cachebust_origin=",
  )
  expect(cadComponents[0].position.x).toBeCloseTo(1)

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
