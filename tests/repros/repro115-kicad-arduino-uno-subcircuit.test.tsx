import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import arduinoUnoCircuitJson from "tests/repros/assets/arduino-uno.circuit.json"

test(
  "repro115-kicad-arduino-uno-subcircuit",
  async () => {
    const { circuit } = getTestFixture({
      platform: { drcChecksDisabled: true },
    })

    circuit.add(
      <board width="80mm" height="60mm">
        <subcircuit
          name="ArduinoUno"
          circuitJson={arduinoUnoCircuitJson as CircuitJson}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    expect(
      circuitJson.filter((elm) => elm.type.includes("error")),
    ).toHaveLength(0)
    expect(
      circuitJson.filter((elm) => elm.type === "pcb_component").length,
    ).toBe(56)
    expect(
      circuitJson.filter((elm) => elm.type === "pcb_plated_hole").length,
    ).toBe(85)
    expect(
      circuitJson.filter((elm) => elm.type === "pcb_silkscreen_path").length,
    ).toBeGreaterThan(200)
    expect(
      circuitJson.filter((elm) => elm.type === "pcb_trace").length,
    ).toBeGreaterThan(0)
    expect(
      circuitJson.filter((elm) => elm.type === "source_trace").length,
    ).toBeGreaterThan(0)

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 80_000 },
)
