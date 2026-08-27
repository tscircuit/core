import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns when chip pins exceed the schematic body height", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width={10} height={10}>
      <chip
        name="U1"
        schWidth={2}
        schHeight={1.2}
        pinLabels={{
          pin1: "DIN",
          pin2: "GAIN",
          pin3: "GND",
          pin4: "N_SD_MODE",
          pin7: "VDD",
          pin9: "OUTP",
          pin10: "OUTN",
          pin14: "LRCLK",
          pin16: "BCLK",
        }}
        schPinStyle={{
          pin1: { marginTop: 0.2 },
          pin14: { marginBottom: 0.2 },
          pin2: { marginBottom: 0.2 },
          pin9: { marginBottom: 0.6 },
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["VDD", "DIN", "BCLK", "LRCLK", "N_SD_MODE", "GAIN", "GND"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["OUTP", "OUTN"],
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit.db.schematic_component_styling_warning
    .list()
    .filter((warning) => warning.styling_issue_type === "ports_outside_body")

  expect(warnings).toEqual([
    expect.objectContaining({
      type: "schematic_component_styling_warning",
      styling_issue_type: "ports_outside_body",
      message:
        "U1 has schematic pins outside its body (VDD, GND); increase schHeight to at least 1.80mm",
      schematic_port_ids: expect.arrayContaining([
        expect.any(String),
        expect.any(String),
      ]),
    }),
  ])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
