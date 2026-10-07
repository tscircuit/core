import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("generic parts render model sources with source ownership and no electrical geometry", () => {
  const { circuit } = getTestFixture({
    platform: { projectBaseUrl: "https://example.com/project/" },
  })
  circuit.add(
    <assembly.device>
      <assembly.part name="EMPTY" displayName="Unmodeled part" />
      <assembly.part name="HIDDEN" cadModel={null} />
      <assembly.part name="MODEL" model="nema17" />
      <assembly.part name="URL" modelUrl="/part.step" />
      <assembly.part
        name="CAD"
        cadModel={{
          objUrl: "/part.obj",
          mtlUrl: "/part.mtl",
          positionOffset: { x: "2mm", y: 3, z: 4 },
          rotationOffset: { x: 10, y: 20, z: 30 },
          modelUnitToMmScale: 2,
        }}
      />
      <assembly.part
        name="JSX"
        cadModel={
          <cadassembly>
            <cadmodel modelUrl="/child.glb" pcbX={8} pcbY={9} pcbZ={10} />
          </cadassembly>
        }
      />
    </assembly.device>,
  )
  circuit.render()
  const sourceFor = (name: string) =>
    circuit.db.source_component.list().find((source) => source.name === name)!
  const cadFor = (name: string) =>
    circuit.db.cad_component
      .list()
      .find(
        (cad) =>
          cad.source_component_id === sourceFor(name).source_component_id,
      )
  expect(circuit.db.source_component.list()).toHaveLength(6)
  for (const source of circuit.db.source_component.list()) {
    expect(any_circuit_element.parse(source)).toMatchObject({
      type: "source_component",
      ftype: "subassembly",
      name: source.name,
    })
  }
  expect(sourceFor("EMPTY").display_name).toBe("Unmodeled part")
  expect(cadFor("EMPTY")).toBeUndefined()
  expect(cadFor("HIDDEN")).toBeUndefined()
  expect(cadFor("MODEL")?.model_glb_url).toBe(
    "https://modelcdn.tscircuit.com/jscad_models/nema17.glb",
  )
  expect(cadFor("URL")?.model_step_url).toBe(
    "https://example.com/project/part.step",
  )
  expect(cadFor("CAD")).toMatchObject({
    model_obj_url: "https://example.com/project/part.obj",
    model_mtl_url: "https://example.com/project/part.mtl",
    position: { x: 2, y: 3, z: 4 },
    rotation: { x: 10, y: 20, z: 30 },
    model_unit_to_mm_scale_factor: 2,
  })
  expect(cadFor("JSX")).toMatchObject({
    model_glb_url: "https://example.com/project/child.glb",
    position: { x: 8, y: 9, z: 10 },
  })
  expect(circuit.db.cad_component.list()).toHaveLength(4)
  expect(circuit.db.pcb_component.list()).toHaveLength(0)
  expect(circuit.db.schematic_component.list()).toHaveLength(0)
  expect(circuit.db.source_port.list()).toHaveLength(0)
})
