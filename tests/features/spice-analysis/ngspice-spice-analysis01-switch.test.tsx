import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"

test(
  "spice-analysis with the ngspice engine for a switch circuit",
  async () => {
    const { circuit } = getTestFixture()
    circuit.setPlatform({
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    })
    circuit.add(
      <board schMaxTraceDistance={10} routingDisabled>
        <voltagesource name="V1" voltage="5V" />
        <resistor name="R_base" resistance="10k" schY={2} />
        <switch name="SW1" simSwitchFrequency="1kHz" schX={1.5} schY={2} />
        <transistor
          name="Q1"
          type="npn"
          footprint="sot23"
          schX={2}
          schY={0.3}
          schRotation={180}
        />
        <resistor name="R_collector" resistance="10k" schY={-2} />

        <trace from=".V1 > .pin1" to=".R_base > .pin1" />
        <trace from=".R_base > .pin2" to=".SW1 > .pin1" />
        <trace from=".SW1 > .pin2" to=".Q1 > .base" />

        <trace from=".V1 > .pin1" to=".R_collector > .pin1" />
        <trace from=".R_collector > .pin2" to=".Q1 > .collector" />

        <trace from=".Q1 > .emitter" to=".V1 > .pin2" />

        <voltageprobe name="VP_COLLECTOR" connectsTo=".R_collector > .pin2" />

        <analogsimulation
          duration="4ms"
          timePerStep="1us"
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
