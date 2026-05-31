import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint circuitjson rehydrates pcb_copper_text", async () => {
  const { circuit } = getTestFixture()

  const footprintWithCopperText = [
    {
      type: "pcb_smtpad",
      shape: "rect",
      x: -0.6,
      y: 0,
      width: 0.5,
      height: 0.7,
      layer: "top",
      port_hints: ["1"],
    },
    {
      type: "pcb_smtpad",
      shape: "rect",
      x: 0.6,
      y: 0,
      width: 0.5,
      height: 0.7,
      layer: "top",
      port_hints: ["2"],
    },
    {
      type: "pcb_copper_text",
      text: "copper text",
      layer: "top",
      anchor_position: { x: 0, y: 1.2 },
      anchor_alignment: "center",
      font_size: 1,
    },
  ] as const

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint={footprintWithCopperText as any} pcbX={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.circuit_json_footprint_load_error.list()).toHaveLength(0)

  const copperTexts = circuit.db.pcb_copper_text.list()
  expect(copperTexts).toHaveLength(1)
  expect(copperTexts[0]).toMatchObject({
    text: "copper text",
    layer: "top",
    anchor_alignment: "center",
    font_size: 1,
  })

  expect(
    convertCircuitJsonToPcbSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path)
})
