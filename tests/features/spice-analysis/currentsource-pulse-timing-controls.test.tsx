import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("currentsource retains delayed load-step timing in Circuit JSON", async () => {
  const { circuit } = getTestFixture()
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
        {...pulseTiming}
        connections={{ pin1: "net.GND", pin2: "net.OUT" }}
      />
      <resistor
        name="R_LOAD"
        resistance="1"
        schX={4}
        connections={{ pin1: "net.OUT", pin2: "net.GND" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.list()[0]).toMatchSnapshot()
  expect(circuit.db.simulation_current_source.list()).toMatchSnapshot()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
