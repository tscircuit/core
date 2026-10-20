import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { AnalogTransientSimulation } from "lib/components/primitive-components/AnalogTransientSimulation"

test("shrinking a transient revalidates its eye gate", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" />
      <analog.transientsimulation
        name="run"
        spiceEngine="pcb_spice"
        duration="20ns"
      />
      <voltageprobe name="probe" connectsTo=".U1 > .pin1" />
      <analog.eyediagram
        name="eye"
        simulationRef=".run"
        probeRef=".probe"
        unitInterval="2ns"
        timeOrigin="0ns"
        startTime="4ns"
        endTime="20ns"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sim = circuit.selectOne(".run") as AnalogTransientSimulation
  sim.setProps({ ...sim.props, duration: "10ns" })
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "gate within its simulation",
  )
})
