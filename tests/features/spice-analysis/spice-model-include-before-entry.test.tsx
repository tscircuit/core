import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a preceding include does not replace the component's entry model", async () => {
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
        displayName="OUT = 0.4 x 2 x IN"
        schX={2}
        pinLabels={{ pin1: "IN", pin2: "OUT", pin3: "GND" }}
        connections={{ IN: "net.IN", OUT: "net.OUT", GND: "net.GND" }}
        spiceModel={
          <spicemodel
            source={`.include "./models/divider.lib"
.subckt DIVIDER IN OUT GND
X1 IN MID GND GAIN_STAGE
E2 OUT GND MID GND 2
.ends DIVIDER`}
          />
        }
      />
      <voltageprobe name="OUT" connectsTo="net.OUT" />
      <analogsimulation
        name="Entry model: OUT = 4V"
        duration="1ms"
        spiceEngine="ngspice"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const graph = circuit.db.simulation_transient_voltage_graph.list()[0]!
  expect(graph.voltage_levels[0]).toBeCloseTo(4, 6)
  expect(graph.voltage_levels.at(-1)).toBeCloseTo(4, 6)
  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
}, 15000)
