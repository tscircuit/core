import { test, expect } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const bridgeDiodeModel = `
.subckt BRIDGE_DIODE ANODE CATHODE
D1 ANODE CATHODE BRIDGE_DIODE_MODEL
.model BRIDGE_DIODE_MODEL D(IS=1e-14 RS=0.2 N=1)
.ends BRIDGE_DIODE
`

test(
  "chip spiceModel custom diodes simulate a full-bridge rectifier",
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
          voltage="5V"
          frequency="40Hz"
          waveShape="sinewave"
          schX={-4}
          schY={0}
          schRotation={270}
        />
        <chip
          name="D1"
          footprint="0402"
          schX={-1.35}
          schY={1.1}
          pinLabels={{ pin1: "ANODE", pin2: "CATHODE" }}
          schPinArrangement={{
            leftSide: ["ANODE"],
            rightSide: ["CATHODE"],
          }}
          spiceModel={<spicemodel source={bridgeDiodeModel} />}
        />
        <chip
          name="D2"
          footprint="0402"
          schX={1.35}
          schY={-1.1}
          pinLabels={{ pin1: "ANODE", pin2: "CATHODE" }}
          schPinArrangement={{
            leftSide: ["ANODE"],
            rightSide: ["CATHODE"],
          }}
          spiceModel={<spicemodel source={bridgeDiodeModel} />}
        />
        <chip
          name="D3"
          footprint="0402"
          schX={1.35}
          schY={1.1}
          pinLabels={{ pin1: "ANODE", pin2: "CATHODE" }}
          schPinArrangement={{
            leftSide: ["CATHODE"],
            rightSide: ["ANODE"],
          }}
          spiceModel={<spicemodel source={bridgeDiodeModel} />}
        />
        <chip
          name="D4"
          footprint="0402"
          schX={-1.35}
          schY={-1.1}
          pinLabels={{ pin1: "ANODE", pin2: "CATHODE" }}
          schPinArrangement={{
            leftSide: ["CATHODE"],
            rightSide: ["ANODE"],
          }}
          spiceModel={<spicemodel source={bridgeDiodeModel} />}
        />
        <resistor
          name="R1"
          resistance="100"
          schX={4}
          schY={0}
          schRotation={270}
        />

        <trace from=".V1 > .pin1" to=".D1 > .ANODE" />
        <trace from=".V1 > .pin1" to=".D4 > .CATHODE" />

        <trace from=".V1 > .pin2" to=".D2 > .CATHODE" />
        <trace from=".V1 > .pin2" to=".D3 > .ANODE" />

        <trace from=".D1 > .CATHODE" to=".D3 > .CATHODE" />
        <trace from=".D1 > .CATHODE" to=".R1 > .pin1" />

        <trace from=".D2 > .ANODE" to=".D4 > .ANODE" />
        <trace from=".D2 > .ANODE" to=".R1 > .pin2" />

        <voltageprobe name="VP_IN1" connectsTo=".V1 > .pin1" />
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

    expect(
      circuitJson.filter((el) => el.type === "simulation_spice_subcircuit"),
    ).toHaveLength(4)
    expect(
      circuitJson.some(
        (el) => el.type === "simulation_transient_voltage_graph",
      ),
    ).toBe(true)

    const differentialProbe = circuitJson.find(
      (el) =>
        el.type === "simulation_voltage_probe" &&
        el.name === "VR1" &&
        el.reference_input_source_port_id,
    )
    expect(differentialProbe).toBeDefined()

    await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
  },
  { timeout: 20000 },
)
