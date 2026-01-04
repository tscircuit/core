import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"

test(
  "spice-analysis with the ngspice engine for a current source circuit",
  async () => {
    const { circuit } = getTestFixture()
    circuit.setPlatform({
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    })
    circuit.add(
      <board schMaxTraceDistance={10} routingDisabled>
        <currentsource
          name="I1"
          peakToPeakCurrent="2A"
          frequency="1kHz"
          waveShape="sinewave"
        />
        <resistor name="R1" resistance="10" />

        <trace from=".I1 > .pos" to=".R1 > .pin1" />
        <trace from=".I1 > .neg" to="net.GND" />
        <trace from=".R1 > .pin2" to="net.GND" />

        <voltageprobe name="VP_R1" connectsTo=".R1 > .pin1" />

        <analogsimulation
          duration="2ms"
          timePerStep="1us"
          spiceEngine="ngspice"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    // Check that we have voltage graphs
    expect(
      circuitJson.some(
        (el) => el.type === "simulation_transient_voltage_graph",
      ),
    ).toBe(true)

    expect(circuit).toMatchSimulationSnapshot(import.meta.path)
  },
  { timeout: 20000 },
)
