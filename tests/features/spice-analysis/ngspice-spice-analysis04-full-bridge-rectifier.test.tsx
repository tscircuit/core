import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"

test(
  "spice-analysis with the ngspice engine for a full-bridge rectifier circuit with differential voltage probe",
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
          frequency="40Hz"
          waveShape="sinewave"
        />
        {/* Full bridge rectifier with 4 diodes */}
        <diode name="D1" />
        <diode name="D2" />
        <diode name="D3" />
        <diode name="D4" />
        <resistor name="R1" resistance="100" />

        {/* Bridge rectifier connections:
            Diamond topology for full wave rectification:
            When AC1 > AC2: current flows D1 → +DC → R1 → -DC → D2
            When AC2 > AC1: current flows D3 → +DC → R1 → -DC → D4
        */}
        {/* AC1 connections (V1 pin1) */}
        <trace from=".V1 > .pin1" to=".D1 > .anode" />
        <trace from=".V1 > .pin1" to=".D4 > .cathode" />

        {/* AC2 connections (V1 pin2) */}
        <trace from=".V1 > .pin2" to=".D2 > .cathode" />
        <trace from=".V1 > .pin2" to=".D3 > .anode" />

        {/* Positive DC rail (cathodes of D1 and D3) */}
        <trace from=".D1 > .cathode" to=".D3 > .cathode" />
        <trace from=".D1 > .cathode" to=".R1 > .pin1" />

        {/* Negative DC rail (anodes of D2 and D4) */}
        <trace from=".D2 > .anode" to=".D4 > .anode" />
        <trace from=".D2 > .anode" to=".R1 > .pin2" />

        {/* Single-ended probes for input */}
        <voltageprobe name="VP_IN1" connectsTo=".V1 > .pin1" />

        {/* Differential probe across the load resistor */}
        <voltageprobe
          name="VR1"
          connectsTo=".R1 > .pin1"
          referenceTo=".R1 > .pin2"
        />

        <analogsimulation
          duration="100ms"
          timePerStep="0.1ms"
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

    // Check that we have a differential voltage probe in the simulation
    const simulationProbes = circuitJson.filter(
      (el) => el.type === "simulation_voltage_probe",
    )
    expect(simulationProbes.length).toBeGreaterThan(0)

    // Find the differential probe
    const differentialProbe = simulationProbes.find(
      (probe: any) =>
        probe.name === "VR1" && probe.reference_input_source_port_id,
    )
    expect(differentialProbe).toBeDefined()

    expect(circuit).toMatchSimulationSnapshot(import.meta.path)
  },
  { timeout: 20000 },
)
