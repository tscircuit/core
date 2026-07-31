import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("blob footprint without an extension is not treated as a library reference", async () => {
  const footprintUrl = URL.createObjectURL(
    new Blob(["<footprint></footprint>"], { type: "text/plain" }),
  )
  const { circuit } = getTestFixture()

  try {
    circuit.add(
      <board width="20mm" height="10mm">
        <chip name="U1" footprint={footprintUrl} />
        <pcbnotetext
          pcbY={-3}
          fontSize={0.6}
          text="Blob URLs are not footprint libraries"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
    expect(
      circuit.db.source_invalid_component_property_error.list(),
    ).toHaveLength(0)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  } finally {
    URL.revokeObjectURL(footprintUrl)
  }
})
