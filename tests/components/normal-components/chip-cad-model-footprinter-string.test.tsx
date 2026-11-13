import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with a custom footprint uses a string cadModel as its footprinter model", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width="1.5mm"
              height="0.6mm"
              pcbX={-2.7}
              pcbY={0}
            />
            <smtpad
              portHints={["pin2"]}
              shape="rect"
              width="1.5mm"
              height="0.6mm"
              pcbX={2.7}
              pcbY={0}
            />
          </footprint>
        }
        cadModel="soic8"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0]).toMatchObject({
    footprinter_string: "soic8",
    model_origin_position: { x: 0, y: 0, z: 0 },
  })
  expect(cadComponents[0]).not.toHaveProperty("show_as_bounding_box")
  expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
