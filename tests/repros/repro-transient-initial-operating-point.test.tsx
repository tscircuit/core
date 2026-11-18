import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("analog.transientsimulation can start an RC circuit at its 5-V DC operating point", async () => {
  const { circuit } = getTestFixture({
    platform: { spiceEngineMap: { ngspice: await createNgspiceSpiceEngine() } },
  })
  circuit.pcbDisabled = true
  // Pass the requested option through even before the props package supports it.
  const initialOperatingPoint = { calculateInitialOperatingPoint: true }
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
      <analog.transientsimulation
        name="Initial DC point: OUT = 5V"
        duration="1ms"
        timePerStep="10us"
        spiceEngine="ngspice"
        {...initialOperatingPoint}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
}, 15000)
