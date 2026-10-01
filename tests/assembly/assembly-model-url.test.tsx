import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("modelUrl renders device, subassembly, alias and connector-attached screen models", () => {
  const { circuit } = getTestFixture({
    platform: { projectBaseUrl: "https://example.com/project/" },
  })
  circuit.add(
    <assembly.device name="product" modelUrl="/housing.GLB?v=2">
      <board name="B1" width={30} height={20} thickness={2} routingDisabled>
        <chip
          name="J1"
          footprint="soic8"
          pcbX={4}
          pcbY={3}
          pcbRotation={90}
          layer="bottom"
        />
      </board>
      <assembly.subassembly name="bracket" modelUrl="/bracket.step">
        <cadmodel modelUrl="/washer.stl" pcbX={2} pcbZ={1} />
      </assembly.subassembly>
      <assembly.cadassembly name="cover" modelUrl="/download#ext=obj" />
      <assembly.screen
        name="screen"
        connectsTo=".B1 .J1"
        modelUrl="/screen.glb"
      />
    </assembly.device>,
  )
  circuit.render()
  const models = circuit.db.cad_component.list()
  expect(
    models.find((m) => m.model_glb_url?.includes("housing")),
  ).toMatchObject({
    model_glb_url: "https://example.com/project/housing.GLB?v=2",
    position: { x: 0, y: 0, z: 0 },
  })
  expect(models.find((m) => m.model_step_url)).toMatchObject({
    model_step_url: "https://example.com/project/bracket.step",
    position: { x: 0, y: 0, z: 0 },
  })
  expect(models.find((m) => m.model_stl_url)).toMatchObject({
    model_stl_url: "https://example.com/project/washer.stl",
    position: { x: 2, y: 0, z: 1 },
  })
  expect(models.find((m) => m.model_obj_url)).toMatchObject({
    model_obj_url: "https://example.com/project/download",
  })
  expect(models.find((m) => m.model_glb_url?.includes("screen"))).toMatchObject(
    {
      position: { x: 4, y: 3, z: -1 },
      rotation: { x: 0, y: 180, z: 90 },
      layer: "bottom",
    },
  )
  // Mechanical models create neither footprints nor schematic components.
  expect(circuit.db.pcb_component.list()).toHaveLength(1)
  expect(circuit.db.schematic_component.list()).toHaveLength(1)
  expect(models.filter((m) => !m.pcb_component_id)).toHaveLength(5)
})
