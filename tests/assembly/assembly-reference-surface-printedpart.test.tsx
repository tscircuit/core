import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("printed parts mount by child surfaces and emit color and print material", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part name="BASE">
        <assembly.referencesurface name="top" centerZOffset="1mm" />
      </assembly.part>
      <assembly.printedpart
        name="SPACER"
        color="#ff8800"
        material="petg"
        mountedTo="BASE.top"
        mountFace="bottom"
        mountGap="2mm"
        jscad={<jscad.cuboid size={[10, 10, 4]} center={[0, 0, 2]} />}
      >
        <assembly.referencesurface
          name="bottom"
          plane="xy"
          normalDirection="z-"
        />
        <assembly.referencesurface name="top" plane="xy" centerZOffset="4mm" />
      </assembly.printedpart>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const source = circuit.db.source_component
    .list()
    .find((s) => s.name === "SPACER")!
  expect(source).toMatchObject({
    ftype: "printedpart",
    material: "petg",
    color: "#ff8800",
  })
  const cad = circuit.db.cad_component.list()
  expect(cad).toHaveLength(1)
  expect(cad[0]).toMatchObject({
    source_component_id: source.source_component_id,
    color: "#ff8800",
    position: { x: 0, y: 0, z: 3 },
  })
  expect(cad[0].model_jscad).toBeDefined()
})
