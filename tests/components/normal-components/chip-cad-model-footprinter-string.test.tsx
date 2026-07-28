import { expect, test } from "bun:test"
import { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test('cadModel="footprinter_string" generates CAD from the resolved footprint', async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="soic8" cadModel="footprinter_string" />
    </board>,
  )

  const chip = circuit.selectOne("chip") as Chip
  chip._asyncFootprintCadModel = {
    glbUrl: "https://example.com/library-model.glb",
  }

  circuit.render()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0]).toMatchObject({
    footprinter_string: "soic8",
  })
  expect(cadComponents[0]?.show_as_bounding_box).toBeUndefined()
  expect(cadComponents[0]?.model_glb_url).toBeUndefined()

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
