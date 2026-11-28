import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("retains parts-engine datasheet metadata alongside an explicit datasheet URL", async () => {
  const { circuit } = getTestFixture()
  const datasheetUrl = "https://example.com/part.pdf"
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async () => [
      {
        type: "source_datasheet",
        source_datasheet_id: "supplier_datasheet",
        manufacturer_part_number: "TEST-IC",
        datasheet_pdf_urls: [datasheetUrl, "https://example.com/alternate.pdf"],
        description: "Test IC",
      },
    ],
  }
  circuit.add(
    <board partsEngine={partsEngine}>
      <chip
        name="U1"
        footprint="pinrow2"
        manufacturerPartNumber="TEST-IC"
        datasheetUrl={datasheetUrl}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type === "source_datasheet"),
  ).toEqual([
    expect.objectContaining({
      manufacturer_part_number: "TEST-IC",
      datasheet_pdf_urls: [datasheetUrl, "https://example.com/alternate.pdf"],
      description: "Test IC",
    }),
  ])
})
