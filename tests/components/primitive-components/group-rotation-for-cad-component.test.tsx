import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group rotation on the cad model", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group name="group1" pcbRotation={45}>
      <chip
        name="U1"
        footprint="soic8"
        cadModel={{
          stlUrl: "https://example.com/test.stl",
        }}
      />
    </group>,
  )

  circuit.render()

  const cad_component = circuit.db.cad_component.list()[0]
  expect(cad_component).toMatchInlineSnapshot(`
    {
      "cad_component_id": "cad_component_0",
      "footprinter_string": undefined,
      "model_glb_url": undefined,
      "model_gltf_url": undefined,
      "model_jscad": undefined,
      "model_mtl_url": undefined,
      "model_obj_url": undefined,
      "model_step_url": undefined,
      "model_stl_url": "https://example.com/test.stl",
      "model_unit_to_mm_scale_factor": undefined,
      "model_wrl_url": undefined,
      "pcb_component_id": "pcb_component_0",
      "position": {
        "x": 0,
        "y": 0,
        "z": 0,
      },
      "rotation": {
        "x": 0,
        "y": 0,
        "z": 45,
      },
      "show_as_translucent_model": undefined,
      "source_component_id": "source_component_0",
      "type": "cad_component",
    }
  `)
})
