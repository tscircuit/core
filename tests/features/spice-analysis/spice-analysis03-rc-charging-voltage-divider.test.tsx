import { test, expect } from "bun:test"
import type { SimulationTransientVoltageGraph } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test(
  "spice-analysis03-rc-charging-voltage-divider",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width={16} height={16} schMaxTraceDistance={5}>
        <chip
          name="V1"
          footprint="sot23"
          pinLabels={{
            pin1: "VOUT",
            pin2: "GND",
          }}
          pinAttributes={{
            VOUT: { providesPower: true, providesVoltage: 5 },
            GND: { providesGround: true },
          }}
          connections={{
            pin3: "net.NC",
          }}
        />

        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={4}
          schX={-2}
          schY={2}
        />
        <resistor
          name="R2"
          resistance="2k"
          footprint="0402"
          pcbX={-4}
          pcbY={-4}
          schX={0}
          schY={4}
        />
        <capacitor
          name="C1"
          capacitance="10uF"
          footprint="0402"
          pcbX={0}
          pcbY={-2}
          schX={0}
          schY={2}
        />

        <trace from={"net.VOUT"} to={sel.R1.pin1} />
        <trace from={".V1 > .VOUT"} to={"net.VOUT"} />
        <trace from={sel.R1.pin2} to={sel.R2.pin1} />
        <trace from={sel.R2.pin2} to={"net.GND"} />
        <trace from={"net.GND"} to={".V1 > .GND"} />

        <trace from={sel.C1.pin1} to={sel.R1.pin2} />
        <trace from={sel.C1.pin2} to={"net.GND"} />

        <analogsimulation />
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
