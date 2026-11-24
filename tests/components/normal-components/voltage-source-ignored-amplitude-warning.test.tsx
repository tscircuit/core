import { expect, test } from "bun:test"
import { circuitJsonToSpice } from "circuit-json-to-spice"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("voltage sources warn when voltage overrides peakToPeakVoltage", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schTraceAutoLabelEnabled>
      <voltagesource
        name="VINPUT"
        voltage={0}
        peakToPeakVoltage={24}
        waveShape="square"
        frequency="1kHz"
        schX={-4}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R1"
        resistance="1k"
        schX={-4}
        schY={-3}
        connections={{ pin1: "VINPUT.pin1", pin2: "net.GND" }}
      />
      <voltagesource
        name="VSINE"
        voltage={2}
        peakToPeakVoltage={10}
        waveShape="sinewave"
        frequency="1kHz"
        schX={4}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        schX={4}
        schY={-3}
        connections={{ pin1: "VSINE.pin1", pin2: "net.GND" }}
      />
      <schematictext
        text={"VINPUT: 24V p-p ignored\nvoltage=0V takes precedence"}
        fontSize={0.18}
        schX={-4}
        schY={2}
      />
      <schematictext
        text={"VSINE: 10V p-p ignored\nvoltage=2V takes precedence"}
        fontSize={0.18}
        schX={4}
        schY={2}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const inputSource = circuit.db.source_component.getWhere({ name: "VINPUT" })!
  const sineSource = circuit.db.source_component.getWhere({ name: "VSINE" })!
  expect(circuit.db.source_property_ignored_warning.list()).toEqual([
    expect.objectContaining({
      source_component_id: inputSource.source_component_id,
      property_name: "peakToPeakVoltage",
      message: expect.stringContaining(
        "VINPUT: peakToPeakVoltage is ignored because voltage is set to 0V.",
      ),
    }),
    expect.objectContaining({
      source_component_id: sineSource.source_component_id,
      property_name: "peakToPeakVoltage",
      message: expect.stringContaining(
        "VSINE: peakToPeakVoltage is ignored because voltage is set to 2V.",
      ),
    }),
  ])

  const spiceString = circuitJsonToSpice(
    circuit.getCircuitJson(),
  ).toSpiceString()
  expect(spiceString).toContain("PULSE(0 0 ")
  expect(spiceString).toContain("SIN(0 2 1000 0 0 0)")
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
