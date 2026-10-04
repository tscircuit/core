import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("printedpart resolves model strings, URLs, and existing cadModel formats", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart name="MODEL" model="nema17" />
      <assembly.printedpart name="HTTP" model="https://example.com/part.glb" />
      <assembly.printedpart
        name="URL"
        modelUrl="https://example.com/part.stl"
      />
      <assembly.printedpart
        name="CAD"
        cadModel={{
          objUrl: "https://example.com/part.obj",
          mtlUrl: "https://example.com/part.mtl",
          positionOffset: { x: 2, y: 3, z: 4 },
          rotationOffset: { x: 10, y: 20, z: 30 },
          modelUnitToMmScale: 2,
        }}
      />
      <assembly.printedpart
        name="PLAN"
        cadModel={{
          jscad: { type: "cuboid", size: [10, 20, 4] },
          positionOffset: { x: 5, y: 6, z: 7 },
        }}
      />
      <assembly.printedpart
        name="JSX"
        cadModel={
          <cadmodel
            modelUrl="https://example.com/child.step"
            pcbX={8}
            pcbY={9}
            pcbZ={10}
          />
        }
      />
      <assembly.printedpart name="HIDDEN" cadModel={null} />
    </assembly.device>,
  )
  circuit.render()
  const cadFor = (name: string) => {
    const source = circuit.db.source_component
      .list()
      .find((source) => source.name === name)!
    return circuit.db.cad_component
      .list()
      .find((cad) => cad.source_component_id === source.source_component_id)!
  }
  expect(cadFor("MODEL").model_glb_url).toBe(
    "https://modelcdn.tscircuit.com/jscad_models/nema17.glb",
  )
  expect(cadFor("HTTP").model_glb_url).toBe("https://example.com/part.glb")
  expect(cadFor("URL").model_stl_url).toBe("https://example.com/part.stl")
  expect(cadFor("CAD")).toMatchObject({
    model_obj_url: "https://example.com/part.obj",
    model_mtl_url: "https://example.com/part.mtl",
    position: { x: 2, y: 3, z: 4 },
    rotation: { x: 10, y: 20, z: 30 },
    model_unit_to_mm_scale_factor: 2,
  })
  expect(cadFor("PLAN")).toMatchObject({
    model_jscad: { type: "cuboid", size: [10, 20, 4] },
    position: { x: 5, y: 6, z: 7 },
  })
  expect(cadFor("JSX")).toMatchObject({
    model_step_url: "https://example.com/child.step",
    position: { x: 8, y: 9, z: 10 },
  })
  expect(cadFor("HIDDEN")).toBeUndefined()
  expect(circuit.db.cad_component.list()).toHaveLength(6)
})
