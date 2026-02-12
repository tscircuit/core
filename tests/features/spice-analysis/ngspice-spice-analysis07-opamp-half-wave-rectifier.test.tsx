import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "ngspice opamp inverting half-wave precision rectifier",
  async () => {
    const { circuit } = getTestFixture()
    circuit.setPlatform({
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    })

    circuit.add(
      <board schMaxTraceDistance={10} routingDisabled>
        {/* AC input source: 40Hz, 500mV amplitude sinewave */}
        <voltagesource
          name="V1"
          voltage="0.5V"
          frequency="40Hz"
          waveShape="sinewave"
          schX={4}
          schY={-3}
          schRotation={0}
        />

        {/* Op-amp U1 */}
        <opamp name="U1" schX={0} schY={0} schRotation={90} />

        {/* Input resistor R1: 10k from Vin to inverting input */}
        <resistor
          name="R1"
          resistance="10k"
          schX={1.5}
          schY={-2}
          schRotation={90}
        />

        {/* Feedback resistor Rf: 10k from VOUT (node B) to inverting input */}
        <resistor
          name="Rf"
          resistance="10k"
          schX={1.5}
          schY={0}
          schRotation={270}
        />

        {/* D1: rectifying diode, anode at opamp output, cathode at VOUT */}
        <diode name="D1" schX={0.7} schY={1} schRotation={0} />

        {/* D2: clamp diode, anode at inverting input, cathode at opamp output */}
        <diode name="D2" schX={-0.5} schY={-2} schRotation={180} />
        <netlabel net="GND" anchorSide="top" connection="V1.pin2" />
        {/* <netlabel net="GND" anchorSide="top" connection="U1.pin1" /> */}

        {/* Input wiring: V1 through R1 to inverting input */}
        <trace from=".V1 > .pin1" to=".R1 > .pin1" />
        <trace from=".R1 > .pin2" to=".U1 > .inverting_input" />

        {/* Non-inverting input to GND */}
        <trace from=".U1 > .non_inverting_input" to="net.GND" />

        {/* D1: anode at opamp output, cathode at VOUT node */}
        <trace from=".D1 > .anode" to=".U1 > .output" />
        <trace from=".D1 > .cathode" to=".Rf > .pin1" />

        {/* Rf: from VOUT (node B) back to inverting input (node A) */}
        <trace from=".Rf > .pin2" to=".U1 > .inverting_input" />

        {/* D2: anode at inverting input, cathode at opamp output */}
        <trace from=".D2 > .anode" to=".U1 > .inverting_input" />
        <trace from=".D2 > .cathode" to=".U1 > .output" />

        {/* Power supply: VCC to positive rail, GND to negative rail */}
        <trace from=".VCC > .pin1" to=".U1 > .positive_supply" />
        <trace from=".VCC > .pin2" to="net.GND" />

        {/* V1 negative terminal to GND */}
        <trace from=".V1 > .pin2" to="net.GND" />

        {/* Voltage probes */}
        <voltageprobe name="VP_IN" connectsTo=".V1 > .pin1" />
        <voltageprobe name="VP_OUT" connectsTo=".Rf > .pin1" />

        <analogsimulation
          duration="75ms"
          timePerStep="0.1ms"
          spiceEngine="ngspice"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    // Verify simulation_op_amp element was created
    const simOpAmps = circuitJson.filter(
      (el) => el.type === "simulation_op_amp",
    )
    expect(simOpAmps).toHaveLength(1)

    const simOpAmp = simOpAmps[0] as any
    expect(simOpAmp.source_component_id).toBeDefined()
    expect(simOpAmp.inverting_input_source_port_id).toBeDefined()
    expect(simOpAmp.non_inverting_input_source_port_id).toBeDefined()
    expect(simOpAmp.output_source_port_id).toBeDefined()
    expect(simOpAmp.positive_supply_source_port_id).toBeDefined()
    expect(simOpAmp.negative_supply_source_port_id).toBeDefined()

    // Verify simulation produced transient voltage graphs
    expect(
      circuitJson.some(
        (el) => el.type === "simulation_transient_voltage_graph",
      ),
    ).toBe(true)

    expect(circuit).toMatchSimulationSnapshot(import.meta.path)
  },
  { timeout: 30000 },
)
