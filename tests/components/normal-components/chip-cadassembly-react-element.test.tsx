import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "lib/register-catalogue"

it("chip with cadassembly cadmodel react element", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        cadModel={
          (
            <cadassembly {...({} as any)}>
              <cadmodel
                modelUrl="https://modelcdn.tscircuit.com/easyeda_models/download?uuid=d0740cb8891c49a88b6949cb978926f3&pn=C965799"
                pcbX={-2}
              />
              <cadmodel
                modelUrl="https://modelcdn.tscircuit.com/easyeda_models/download?uuid=a1e5e433dfbd402f854a03c19c373fbf&pn=C7428714"
                pcbX={2}
              />
            </cadassembly>
          ) as any
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
