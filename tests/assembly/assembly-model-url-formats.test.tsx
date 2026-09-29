import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly modelUrl supports cadmodel formats and unnamed device models", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device modelUrl="/device.stl">
      <assembly.subassembly name="gltf" modelUrl="/part.gltf" />
      <assembly.subassembly name="stp" modelUrl="/part.stp" />
      <assembly.subassembly name="vrml" modelUrl="/part.vrml" />
      <assembly.subassembly name="wrl" modelUrl="/part.wrl" />
      <assembly.subassembly name="fallback" modelUrl="/download" />
    </assembly.device>,
  )
  circuit.render()
  const models = circuit.db.cad_component.list()
  expect(models).toHaveLength(6)
  expect(
    models
      .map((m) => m.model_stl_url)
      .filter(Boolean)
      .sort(),
  ).toEqual(["/device.stl", "/download"])
  expect(models.find((m) => m.model_gltf_url)?.model_gltf_url).toBe(
    "/part.gltf",
  )
  expect(models.find((m) => m.model_step_url)?.model_step_url).toBe("/part.stp")
  expect(models.map((m) => m.model_wrl_url).filter(Boolean)).toEqual([
    "/part.vrml",
    "/part.wrl",
  ])
})
