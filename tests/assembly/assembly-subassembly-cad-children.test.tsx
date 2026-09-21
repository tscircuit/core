import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested subassemblies group CAD children without attachment targets", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="device">
      <assembly.subassembly name="outer">
        <assembly.cadassembly
          name="inner"
          cadModel={
            <cadassembly>
              <cadmodel
                modelUrl="https://example.com/a.glb"
                pcbX={2}
                pcbY={3}
                pcbZ={4}
              />
            </cadassembly>
          }
        >
          <cadmodel modelUrl="https://example.com/b.obj" pcbX={-2} />
          <assembly.subassembly
            name="nested"
            cadModel={{
              glbUrl: "https://example.com/c.glb",
              positionOffset: { x: 2, y: 3, z: 4 },
            }}
          />
        </assembly.cadassembly>
      </assembly.subassembly>
    </assembly.device>,
  )
  circuit.render()
  const cad = circuit.db.cad_component.list()
  expect(cad).toHaveLength(3)
  const a = cad.find((c) => c.model_glb_url?.endsWith("a.glb"))!
  const b = cad.find((c) => c.model_obj_url?.endsWith("b.obj"))!
  const c = cad.find((c) => c.model_glb_url?.endsWith("c.glb"))!
  expect(a.position).toEqual({ x: 2, y: 3, z: 4 })
  expect(b.position).toEqual({ x: -2, y: 0, z: 0 })
  expect(c.position).toEqual(a.position)
  expect(c.rotation).toEqual(a.rotation)
})
