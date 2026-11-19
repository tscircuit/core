import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("currentsource retains delayed load-step timing in Circuit JSON", async () => {
  const { circuit } = getTestFixture()
  circuit.setPlatform({
    spiceEngineMap: { ngspice: await createNgspiceSpiceEngine() },
  })
  const pulseTiming = {
    pulseDelay: "20ms",
    riseTime: "10us",
    fallTime: "20us",
    pulseWidth: "10ms",
    period: "20ms",
  }
  circuit.add(
    <board routingDisabled>
      <currentsource
        name="LOAD"
        current="0.5A"
        peakToPeakCurrent="0.5A"
        waveShape="square"
        frequency="50Hz"
        {...pulseTiming}
        schX={-4}
        connections={{ pin1: "net.GND", pin2: "net.OUT" }}
      />
      <resistor
        name="R_LOAD"
        resistance="1"
        schX={4}
        connections={{ pin1: "net.OUT", pin2: "net.GND" }}
      />
      <voltageprobe name="OUT" connectsTo="net.OUT" />
      <analogsimulation
        name="0.5 A to 1 A load step after 20 ms"
        duration="60ms"
        timePerStep="100us"
        spiceEngine="ngspice"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.list()[0]).toMatchSnapshot()
  expect(circuit.db.simulation_current_source.list()).toMatchSnapshot()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
