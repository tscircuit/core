import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "Choosing ngspice when it's not in the platform config",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board schMaxTraceDistance={10} routingDisabled>
        <voltagesource name="V1" voltage="5V" />
        <switch name="SW1" spst simSwitchFrequency="1kHz" />
        <trace from=".V1 > .terminal1" to=".SW1 > .pin1" />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          connections={{ pin1: ".SW1 > .pin2", pin2: ".V1 > .terminal2" }}
        />
        <voltageprobe connectsTo={".R1 > .pin1"} />
        <analogsimulation
          duration="4ms"
          timePerStep="10us"
          spiceEngine="ngspice"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    expect(
      circuitJson.some(
        (el) => el.type === "simulation_transient_voltage_graph",
      ),
    ).toBe(true)

    expect(circuit).toMatchSimulationSnapshot(import.meta.path)
  },
  { timeout: 20000 },
)
