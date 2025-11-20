import { test, expect } from "bun:test"
import type { SimulationTransientVoltageGraph } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "spice-analysis02-boost-converter",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width={30} height={30} schMaxTraceDistance={5}>
        <voltagesource
          name="V1"
          voltage={"5V"}
          schY={2}
          schX={-5}
          schRotation={270}
        />
        <trace from={".V1 > .pin1"} to={".L1 > .pin1"} />
        <trace from={".L1 > .pin2"} to={".D1 > .anode"} />
        <trace from={".D1 > .cathode"} to={".C1 > .pin1"} />
        <trace from={".D1 > .cathode"} to={".R1 > .pin1"} />
        <trace from={".C1 > .pin2"} to={".R1 > .pin2"} />
        <trace from={".R1 > .pin2"} to={".V1 > .pin2"} />
        <trace from={".L1 > .pin2"} to={".M1 > .drain"} />
        <trace from={".M1 > .source"} to={".V1 > .pin2"} />
        <trace from={".M1 > .source"} to={"net.GND"} />
        <trace from={".M1 > .gate"} to={".V2 > .pin1"} />
        <trace from={".V2 > .pin2"} to={".V1 > .pin2"} />
        <inductor name="L1" inductance={"1H"} schY={3} pcbY={3} />
        <diode
          name="D1"
          footprint={"0603"}
          schY={3}
          schX={3}
          pcbY={6}
          pcbX={3}
        />
        <capacitor
          polarized
          schRotation={270}
          name="C1"
          capacitance={"10uF"}
          footprint={"0603"}
          schX={3}
          pcbX={3}
        />
        <resistor
          schRotation={270}
          name="R1"
          resistance={"1k"}
          footprint={"0603"}
          schX={6}
          pcbX={9}
        />
        <voltagesource
          name="V2"
          schRotation={270}
          voltage={"10V"}
          waveShape="square"
          dutyCycle={0.68}
          frequency={"1kHz"}
          schX={-3}
        />
        <mosfet
          channelType="n"
          footprint={"sot23"}
          name="M1"
          mosfetMode="enhancement"
          pcbX={-4}
        />
        <voltageprobe name="5V" connectsTo={".V1 > .pin1"} />
        <voltageprobe connectsTo={".R1 > .pin1"} />

        <analogsimulation duration={100} timePerStep={1} />
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
