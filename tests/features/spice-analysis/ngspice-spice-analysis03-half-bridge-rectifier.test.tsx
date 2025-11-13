import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"

test(
  "spice-analysis with the ngspice engine for a half-bridge rectifier circuit",
  async () => {
    const { circuit } = getTestFixture()
    circuit.setPlatform({
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    })
    circuit.add(
      <board schMaxTraceDistance={10} routingDisabled>
        <voltagesource
          name="V1"
          voltage="5V" /* 5V amplitude -> 10V pk-pk */
          frequency="60Hz"
          waveShape="sinewave"
        />
        <diode name="D1" />
        <resistor name="R1" resistance="1k" />
        <capacitor name="C1" capacitance="100uF" />

        <trace from=".V1 > .pin1" to=".D1 > .anode" />
        <trace from=".D1 > .cathode" to=".R1 > .pin1" />
        <trace from=".D1 > .cathode" to=".C1 > .pin1" />

        <trace from=".V1 > .pin2" to=".R1 > .pin2" />
        <trace from=".V1 > .pin2" to=".C1 > .pin2" />

        <voltageprobe name="VP_IN" connectsTo=".V1 > .pin1" />
        <voltageprobe name="VP_OUT" connectsTo=".R1 > .pin1" />

        <analogsimulation
          duration="50ms"
          timePerStep="0.1ms"
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
