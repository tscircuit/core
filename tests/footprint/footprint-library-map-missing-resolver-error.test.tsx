import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("missing footprint library resolver reports a load error", async () => {
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: async () => ({}),
        fetchPartCircuitJson: async () => {
          throw new Error(
            "Parts engine must not resolve a non-supplier footprint library",
          )
        },
      },
    },
  })

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        supplierPartNumbers={{ mouser: ["123456"] }}
        footprint="missing:R_0402"
      />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.6}
        text="Missing library resolver reports an error"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.external_footprint_load_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain(
    'No footprint resolver is configured for library "missing".',
  )
  expect(errors[0].footprinter_string).toBe("missing:R_0402")
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
