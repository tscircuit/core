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
          (
            <cadmodel
              modelUrl="https://modelcdn.tscircuit.com/easyeda_models/download?pn=C2889342"
              pcbX={1}
            />
          ) as any
        }
      />
    </board>,
  )

  circuit.render()

  const cad = circuit.db.cad_component.list()
  expect(cad).toHaveLength(1)
  expect(cad[0].model_stl_url).toBe(
    "https://modelcdn.tscircuit.com/easyeda_models/download?pn=C2889342&cachebust_origin=",
  )
  expect(cad[0].position.x).toBeCloseTo(1)

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
