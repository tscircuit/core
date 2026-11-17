import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ngspice simulates a model with a project-relative library", async () => {
  const { circuit, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
  })
  circuit.pcbDisabled = true
  circuit.setPlatform({
    projectBaseUrl: staticAssetsServerUrl,
    spiceEngineMap: { ngspice: await createNgspiceSpiceEngine() },
  })
  circuit.add(
    <board routingDisabled>
      <voltagesource
        name="V1"
        voltage="5V"
        schX={-5}
        connections={{ pin1: "net.IN", pin2: "net.GND" }}
      />
      <chip
        name="U1"
        displayName="OUT = 0.4 x IN"
        schX={2}
        pinLabels={{ pin1: "IN", pin2: "OUT", pin3: "GND" }}
        connections={{ IN: "net.IN", OUT: "net.OUT", GND: "net.GND" }}
        spiceModel={
          <spicemodel
            source={`.subckt DIVIDER IN OUT GND
X1 IN OUT GND GAIN_STAGE
.ends DIVIDER
.include "./models/divider.lib"`}
          />
        }
      />
      <voltageprobe name="OUT" connectsTo="net.OUT" />
      <analogsimulation duration="1ms" spiceEngine="ngspice" />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
  const graph = circuit.db.simulation_transient_voltage_graph.list()[0]!
  expect(graph.voltage_levels[0]).toBeCloseTo(2, 6)
  expect(graph.voltage_levels.at(-1)).toBeCloseTo(2, 6)
  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
}, 15000)
