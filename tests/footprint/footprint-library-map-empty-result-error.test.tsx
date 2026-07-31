import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty footprint library resolver result reports a load error", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        custom: async () => ({ footprintCircuitJson: [] }),
      },
    },
  })

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="custom:R_0402" />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.6}
        text="Empty resolver result reports an error"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.external_footprint_load_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain(
    'Footprint resolver returned no circuit elements for "custom:R_0402".',
  )
  expect(errors[0].footprinter_string).toBe("custom:R_0402")
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
