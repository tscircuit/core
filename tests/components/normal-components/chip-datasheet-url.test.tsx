import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("renders one datasheet for components sharing a part number and URL", () => {
  const { circuit } = getTestFixture()
  const datasheetUrl = "https://example.com/part.pdf"
  circuit.add(
    <board>
      <chip
        name="U1"
        manufacturerPartNumber="TEST-IC"
        datasheetUrl={datasheetUrl}
      />
      <chip
        name="U2"
        manufacturerPartNumber="TEST-IC"
        datasheetUrl={datasheetUrl}
      />
    </board>,
  )

  circuit.render()

  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type === "source_datasheet"),
  ).toEqual([
    expect.objectContaining({
      manufacturer_part_number: "TEST-IC",
      datasheet_pdf_urls: [datasheetUrl],
    }),
  ])
})
