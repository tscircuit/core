import { test, expect } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const boostDiodeModel = `
.subckt BOOST_DIODE ANODE CATHODE
D1 ANODE CATHODE BOOST_DIODE_MODEL
.model BOOST_DIODE_MODEL D(IS=1e-14 RS=0.1 N=1)
.ends BOOST_DIODE
`

test(
  "chip spiceModel custom diode simulates a boost converter",
  async () => {
    const { circuit } = getTestFixture()
    circuit.setPlatform({
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    })

    circuit.add(
      <board width={30} height={30} schMaxTraceDistance={5} routingDisabled>
        <voltagesource
          name="V1"
          voltage="5V"
          schY={2}
          schX={-5}
          schRotation={270}
        />
        <inductor name="L1" inductance="1H" schY={3} pcbY={3} />
        <chip
          name="D1"
          footprint="0402"
          schY={3}
          schX={3}
          pcbY={6}
          pcbX={3}
          pinLabels={{
            pin1: "ANODE",
            pin2: "CATHODE",
          }}
          spiceModel={<spicemodel source={boostDiodeModel} />}
        />
        <capacitor
          polarized
          schRotation={270}
          name="C1"
          capacitance="10uF"
          footprint="0603"
          schX={3}
          pcbX={3}
        />
        <resistor
          schRotation={270}
          name="R1"
          resistance="1k"
          footprint="0603"
          schX={6}
          pcbX={9}
        />
        <voltagesource
          name="V2"
          schRotation={270}
          voltage="10V"
          waveShape="square"
          dutyCycle={0.68}
          frequency="1kHz"
          schX={-3}
        />
        <mosfet
          channelType="n"
          footprint="sot23"
          name="M1"
          mosfetMode="enhancement"
          pcbX={-4}
        />

        <trace from=".V1 > .pin1" to=".L1 > .pin1" />
        <trace from=".L1 > .pin2" to=".D1 > .ANODE" />
        <trace from=".D1 > .CATHODE" to=".C1 > .pin1" />
        <trace from=".D1 > .CATHODE" to=".R1 > .pin1" />
        <trace from=".C1 > .pin2" to=".R1 > .pin2" />
        <trace from=".R1 > .pin2" to=".V1 > .pin2" />
        <trace from=".L1 > .pin2" to=".M1 > .drain" />
        <trace from=".M1 > .source" to=".V1 > .pin2" />
        <trace from=".M1 > .source" to="net.GND" />
        <trace from=".M1 > .gate" to=".V2 > .pin1" />
        <trace from=".V2 > .pin2" to=".V1 > .pin2" />

        <voltageprobe name="VP_IN" connectsTo=".V1 > .pin1" />
        <voltageprobe name="VP_OUT" connectsTo=".R1 > .pin1" />

        <analogsimulation
          duration="100ms"
          timePerStep="100us"
          spiceEngine="ngspice"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    expect(
      circuitJson.some((el) => el.type === "simulation_spice_subcircuit"),
    ).toBe(true)
    expect(
      circuitJson.some(
        (el) => el.type === "simulation_transient_voltage_graph",
      ),
    ).toBe(true)

    await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
  },
  { timeout: 20000 },
)
