import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip cadModel glbUrl accepts relative path", () => {
  const { circuit } = getTestFixture({
    platform: {
      projectBaseUrl: `http://localhost:3020/api/files/static`,
    },
  })

  circuit.add(
    <board width="12mm" height="30mm">
      <chip
        name="H1"
        pcbX={0}
        pcbY={0}
        cadModel={<cadmodel modelUrl="soic8.glb" />}
        footprint={
          <footprint>
            <hole diameter="0.8mm" pcbX={0} pcbY={0} />
          </footprint>
        }
      />{" "}
      <chip
        name="H2"
        pcbX={0}
        pcbY={0}
        cadModel={<cadmodel modelUrl="/soic8.glb" />}
        footprint={
          <footprint>
            <hole diameter="0.8mm" pcbX={0} pcbY={0} />
          </footprint>
        }
      />{" "}
      <chip
        name="H3"
        pcbX={0}
        pcbY={0}
        cadModel={<cadmodel modelUrl="/glbs/soic8.glb" />}
        footprint={
          <footprint>
            <hole diameter="0.8mm" pcbX={0} pcbY={0} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()
  const cadComponent = circuit.db.cad_component.list()[0]
  expect(cadComponent.model_glb_url).toBe(
    "http://localhost:3020/api/files/static/soic8.glb",
  )
  const cadComponent2 = circuit.db.cad_component.list()[1]
  expect(cadComponent2.model_glb_url).toBe(
    "http://localhost:3020/api/files/static/soic8.glb",
  )
  const cadComponent3 = circuit.db.cad_component.list()[2]
  expect(cadComponent3.model_glb_url).toBe(
    "http://localhost:3020/api/files/static/glbs/soic8.glb",
  )
})
