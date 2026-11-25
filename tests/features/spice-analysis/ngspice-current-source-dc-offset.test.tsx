import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"

test("ngspice preserves a square current source's DC offset", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    },
  })
  circuit.pcbDisabled = true
  circuit.add(
    <board schMaxTraceDistance={10} routingDisabled>
      <currentsource
        name="I_LOAD"
        current="0.5A"
        peakToPeakCurrent="0.5A"
        frequency="1kHz"
        waveShape="square"
        schX={-2}
        schRotation={90}
        connections={{ pin1: "net.GND", pin2: "net.OUT" }}
      />
      <resistor
        name="R_LOAD"
        resistance="1"
        schX={2}
        schRotation={90}
        connections={{ pin1: "net.GND", pin2: "net.OUT" }}
      />
      <voltageprobe name="OUT" connectsTo="net.OUT" />
      <analogsimulation
        name="Expected: 0.5 A to 1 A into 1 ohm gives OUT = 0.5 V to 1 V"
        duration="3ms"
        timePerStep="10us"
        spiceEngine="ngspice"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const graphs = circuit.db.simulation_transient_voltage_graph.list()
  expect(graphs).toHaveLength(1)
  expect(Math.min(...graphs[0]!.voltage_levels)).toBeCloseTo(0)
  expect(Math.max(...graphs[0]!.voltage_levels)).toBeCloseTo(0.5)
  await expect(circuit).toMatchSimulationSnapshot(import.meta.path, {
    width: 1000,
    height: 760,
    schematicHeightRatio: 0.4,
  })
}, 20_000)
