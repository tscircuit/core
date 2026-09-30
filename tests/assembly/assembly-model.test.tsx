import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly model strings emit modelcdn GLBs and retain assembly placement", () => {
  const { circuit } = getTestFixture({
    platform: { projectBaseUrl: "https://example.com/" },
  })
  circuit.add(
    <assembly.device name="product" model="  soic8  ">
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
      <assembly.subassembly name="header" model="pinrow4_p2.54mm">
        <cadmodel modelUrl="/washer.stl" pcbX={2} pcbZ={1} />
      </assembly.subassembly>
      <assembly.cadassembly name="alias" model="soic8" />
      <assembly.screen
        name="display"
        connectsTo=".B1 .J1"
        model="flexscreen_w26.7mm_h19.26mm"
      />
    </assembly.device>,
  )
  circuit.render()
  const models = circuit.db.cad_component.list()
  const cadFor = (name: string) =>
    models.find(
      (c) =>
        c.source_component_id ===
        circuit.db.source_component.list().find((s) => s.name === name)
          ?.source_component_id,
    )!
  expect(cadFor("product")).toMatchObject({
    model_glb_url: "https://modelcdn.tscircuit.com/jscad_models/soic8.glb",
    position: { x: 0, y: 0, z: 0 },
  })
  expect(cadFor("alias").model_glb_url).toBe(cadFor("product").model_glb_url)
  expect(
    models.find((c) => c.model_glb_url?.includes("pinrow4"))?.model_glb_url,
  ).toBe("https://modelcdn.tscircuit.com/jscad_models/pinrow4_p2.54mm.glb")
  expect(cadFor("display")).toMatchObject({
    model_glb_url:
      "https://modelcdn.tscircuit.com/jscad_models/flexscreen_w26.7mm_h19.26mm.glb",
    position: { x: 4, y: 3, z: -1 },
    rotation: { x: 0, y: 180, z: 270 },
    layer: "bottom",
  })
  expect(models.find((c) => c.model_stl_url)?.position).toEqual({
    x: 2,
    y: 0,
    z: 1,
  })
  expect(circuit.db.pcb_component.list()).toHaveLength(1)
  expect(
    models
      .filter((c) => c.model_glb_url)
      .every(
        (c) =>
          c.footprinter_string === undefined &&
          c.pcb_component_id === undefined,
      ),
  ).toBe(true)
})
