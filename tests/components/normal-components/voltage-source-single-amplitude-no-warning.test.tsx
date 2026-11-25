import { expect, test } from "bun:test"
import { circuitJsonToSpice } from "circuit-json-to-spice"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("voltage sources accept either amplitude property without a warning", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schTraceAutoLabelEnabled>
      <voltagesource
        name="VZERO"
        voltage={0}
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
        connections={{ pin1: "VZERO.pin1", pin2: "net.GND" }}
      />
      <voltagesource
        name="VINPUT"
        peakToPeakVoltage={24}
        waveShape="square"
        frequency="1kHz"
        schX={4}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        schX={4}
        schY={-3}
        connections={{ pin1: "VINPUT.pin1", pin2: "net.GND" }}
      />
      <schematictext
        text={"VZERO: voltage=0V\nVINPUT: peakToPeakVoltage=24V"}
        fontSize={0.18}
        schY={2}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_property_ignored_warning.list()).toEqual([])
  const spiceString = circuitJsonToSpice(
    circuit.getCircuitJson(),
  ).toSpiceString()
  expect(spiceString).toContain("PULSE(0 0 ")
  expect(spiceString).toContain("PULSE(0 24 ")
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
