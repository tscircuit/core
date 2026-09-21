import { expect, test } from "bun:test"
import { type CadModelProp } from "@tscircuit/props"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standalone assemblies accept CAD formats, null, and nested model-less containers", () => {
  const models: CadModelProp[] = [
    "soic8",
    { glbUrl: "/model.glb" },
    { gltfUrl: "/model.gltf" },
    { stlUrl: "/model.stl" },
    { objUrl: "/model.obj", mtlUrl: "/model.mtl" },
    { stepUrl: "/model.step" },
    { wrlUrl: "/model.wrl" },
    { jscad: { type: "cuboid", size: [1, 1, 1] } },
  ]
  const { circuit } = getTestFixture({
    platform: { projectBaseUrl: "https://example.com/project/" },
  })
  circuit.add(
    <assembly.device name="device">
      <assembly.subassembly name="empty">
        <assembly.cadassembly name="hidden" cadModel={null} />
      </assembly.subassembly>
      {models.map((cadModel, i) => (
        <assembly.subassembly
          key={JSON.stringify(cadModel)}
          name={`model${i}`}
          cadModel={cadModel}
        />
      ))}
    </assembly.device>,
  )
  circuit.render()
  const cad = circuit.db.cad_component.list()
  expect(cad).toHaveLength(models.length)
  expect(cad[0].footprinter_string).toBe("soic8")
  for (const [index, field, suffix] of [
    [1, "model_glb_url", "glb"],
    [2, "model_gltf_url", "gltf"],
    [3, "model_stl_url", "stl"],
    [4, "model_obj_url", "obj"],
    [5, "model_step_url", "step"],
    [6, "model_wrl_url", "wrl"],
  ] as const)
    expect(cad[index][field]).toBe(
      `https://example.com/project/model.${suffix}`,
    )
  expect(cad[7].model_jscad).toEqual({ type: "cuboid", size: [1, 1, 1] })
  expect(
    cad.every(
      (c) => c.position.x === 0 && c.position.y === 0 && c.position.z === 0,
    ),
  ).toBe(true)
  expect(circuit.db.pcb_component.list()).toHaveLength(0)
  expect(cad.every((c) => c.pcb_component_id === undefined)).toBe(true)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit.db.schematic_component.list()).toHaveLength(0)
})
