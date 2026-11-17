import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("analogsimulation can start an RC circuit at its 5-V DC operating point", async () => {
  const { circuit } = getTestFixture({
    platform: { spiceEngineMap: { ngspice: await createNgspiceSpiceEngine() } },
  })
  circuit.pcbDisabled = true
  circuit.add(
    <board routingDisabled>
      <voltagesource
        name="V1"
        voltage="5V"
        schX={-4}
        connections={{ pin1: "net.IN", pin2: "net.GND" }}
      />
      <resistor
        name="R1"
        resistance="1k"
        schX={0}
        connections={{ pin1: "net.IN", pin2: "net.OUT" }}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        schX={4}
        connections={{ pin1: "net.OUT", pin2: "net.GND" }}
      />
      <voltageprobe name="OUT" connectsTo="net.OUT" />
      <analogsimulation
        name="Initial DC point: OUT = 5V"
        duration="1ms"
        timePerStep="10us"
        spiceEngine="ngspice"
        calculateInitialOperatingPoint
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
  const graph = circuit.db.simulation_transient_voltage_graph.list()[0]!
  expect(graph.voltage_levels[0]).toBeCloseTo(5, 6)
  expect(graph.voltage_levels.at(-1)).toBeCloseTo(5, 6)
}, 15000)
