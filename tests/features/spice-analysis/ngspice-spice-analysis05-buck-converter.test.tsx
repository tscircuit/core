import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"

test(
  "spice-analysis with the ngspice engine for a buck converter circuit",
  async () => {
    const { circuit } = getTestFixture()
    circuit.setPlatform({
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    })
    circuit.add(
      <board schMaxTraceDistance={10} routingDisabled>
        {/* Input voltage source */}
        <voltagesource
          name="V1"
          voltage={"5V"}
          schY={0}
          schX={-6}
          schRotation={270}
        />

        {/* N-channel MOSFET as high-side switch */}
        <mosfet
          channelType="n"
          name="M1"
          mosfetMode="enhancement"
          schX={-3}
          schY={2}
        />

        {/* PWM signal for MOSFET */}
        <voltagesource
          name="V2"
          voltage={"10V"}
          waveShape="square"
          dutyCycle={0.5}
          frequency={"1kHz"}
          schX={-5.5}
          schY={3}
          schRotation={0}
        />

        {/* Flyback diode */}
        <diode name="D1" schX={-1} schY={0} />

        {/* Inductor */}
        <inductor
          name="L1"
          inductance={"1H"}
          schX={1}
          schY={2}
          schRotation={270}
        />

        {/* Output capacitor */}
        <capacitor name="C1" capacitance={"10uF"} schX={4} schY={1} />

        {/* Load resistor */}
        <resistor name="R1" resistance={"1k"} schX={4} schY={-1} />

        {/* Connections */}
        <trace from={".V1 > .pin1"} to={".M1 > .drain"} />

        <trace from={".V2 > .pin1"} to={".M1 > .gate"} />
        <trace from={".V2 > .pin2"} to={"net.GND"} />

        <trace from={".M1 > .source"} to={".D1 > .cathode"} />
        <trace from={".M1 > .source"} to={".L1 > .pin1"} />

        <trace from={".L1 > .pin2"} to={".C1 > .pin1"} />
        <trace from={".L1 > .pin2"} to={".R1 > .pin1"} />

        {/* Ground Connections */}
        <trace from={".V1 > .pin2"} to={"net.GND"} />
        <trace from={".D1 > .anode"} to={"net.GND"} />
        <trace from={".C1 > .pin2"} to={"net.GND"} />
        <trace from={".R1 > .pin2"} to={"net.GND"} />

        {/* Probes */}
        <voltageprobe name="VP_IN" connectsTo={".V1 > .pin1"} />
        <voltageprobe name="VP_OUT" connectsTo={".R1 > .pin1"} />

        <analogsimulation
          duration={"100ms"}
          timePerStep={"10us"}
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
