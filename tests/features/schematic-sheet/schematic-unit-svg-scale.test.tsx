import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an inch of authored placement spans one quarter of a four-inch sheet in SVG", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board defaultSchematicLengthUnit="mm">
      <schematicsheet name="Scale" sheetWidth="101.6mm" sheetHeight="50.8mm">
        <schematictext text="Origin" schX={0} schY={0} />
        <schematictext text="One inch" schX="1in" schY={12.7} />
      </schematicsheet>
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  expect(
    json.find(
      (record) => record.type === "source_group" && record.is_subcircuit,
    ),
  ).toMatchObject({ default_schematic_length_unit: "mm" })
  expect(
    json.find(
      (record) =>
        record.type === "schematic_text" && record.text === "One inch",
    ),
  ).toMatchObject({
    schematic_length_unit: "mm",
    position: { x: 25.4, y: 12.7 },
  })
  const svg = await circuit.getSvg({ view: "schematic" })
  const labels: { x: number; y: number }[] = []
  let sheetWidth = 0
  let sheetHeight = 0
  await new HTMLRewriter()
    .on('rect[data-schematic-rect-id$="_outer"]', {
      element(frame) {
        sheetWidth = Number(frame.getAttribute("width"))
        sheetHeight = Number(frame.getAttribute("height"))
      },
    })
    .on('text[data-schematic-text-id^="schematic_text_"]', {
      element(label) {
        labels.push({
          x: Number(label.getAttribute("x")),
          y: Number(label.getAttribute("y")),
        })
      },
    })
    .transform(new Response(svg))
    .text()
  expect(labels).toHaveLength(2)
  expect((labels[1].x - labels[0].x) / sheetWidth).toBeCloseTo(0.25, 8)
  expect((labels[0].y - labels[1].y) / sheetHeight).toBeCloseTo(0.25, 8)
})
