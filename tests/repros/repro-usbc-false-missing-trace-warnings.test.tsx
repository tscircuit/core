import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: USB-C resolution leaves missing-trace warnings on connected pins", async () => {
  const { circuit } = getTestFixture()
  const partsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C165948"] }),
    fetchPartCircuitJson: async () =>
      usbCC165948CircuitJson as AnyCircuitElement[],
  }

  circuit.add(
    <board width={40} height={24} routingDisabled partsEngine={partsEngine}>
      <net name="GND" isGroundNet />
      <connector name="J1" standard="usb_c" pcbX={12} schX={6} />
      <chip
        name="U1"
        footprint="soic8"
        pcbX={-10}
        schX={-4}
        pinLabels={{ pin1: "GND" }}
        pinAttributes={{ pin1: { requiresGround: true } }}
      />
      <resistor name="R1" resistance="1k" footprint="0603" schX={0} />
      <trace from=".U1 > .pin1" to="net.GND" />
      <trace from=".R1 > .pin1" to="net.GND" />
      <trace from=".R1 > .pin2" to="net.GND" />
      <schematictext
        text="Repro: connected U1.GND and both R1 pins receive missing-trace warnings"
        schX={1}
        schY={-4}
        fontSize={0.2}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit.db.source_pin_missing_trace_warning.list()
  const traces = circuit.db.source_trace.list()
  expect(traces).toHaveLength(3)
  // Capture the current bug; the correct warning count would be zero.
  expect(warnings.map((warning) => warning.message)).toEqual([
    "Port GND on U1 is missing a trace",
    "Port pin1 on R1 is missing a trace",
    "Port pin2 on R1 is missing a trace",
  ])
  for (const warning of warnings) {
    expect(
      traces.some((trace) =>
        trace.connected_source_port_ids.includes(warning.source_port_id),
      ),
    ).toBe(true)
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
