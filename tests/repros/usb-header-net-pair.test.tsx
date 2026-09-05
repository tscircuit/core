import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A passive USB signal interconnect with two standard 2.54 mm headers.
function UsbHeaderBoard() {
  return (
    <board width={18} height={14} autorouter="auto-local">
      <pinheader
        name="J1"
        pinCount={4}
        footprint="pinrow4"
        pcbRotation={90}
        pcbX={-5}
      />
      <pinheader
        name="J2"
        pinCount={4}
        footprint="pinrow4"
        pcbRotation={90}
        pcbX={5}
      />
      <trace from=".J1 > .pin1" to="net.VBUS" />
      <trace from=".J2 > .pin1" to="net.VBUS" />
      <trace from=".J1 > .pin2" to="net.DM" />
      <trace from=".J2 > .pin2" to="net.DM" />
      <trace from=".J1 > .pin3" to="net.DP" />
      <trace from=".J2 > .pin3" to="net.DP" />
      <trace from=".J1 > .pin4" to="net.GND" />
      <trace from=".J2 > .pin4" to="net.GND" />
      <autoroutingphase
        phaseIndex={0}
        connections={["net.DP", "net.DM"]}
        autorouter="auto-local"
      />
      <autoroutingphase
        phaseIndex={1}
        connections={["net.VBUS", "net.GND"]}
        autorouter="auto-local"
      />
      <differentialpair
        name="USB"
        positiveConnection=".J1 > .pin3"
        negativeConnection=".J1 > .pin2"
        maxLengthSkew={0.1}
      />
      <pcbnotetext text="USB header interconnect" pcbY={5.5} fontSize={0.7} />
      <pcbnotetext
        text="1: VBUS   2: D-   3: D+   4: GND"
        pcbY={-5.5}
        fontSize={0.55}
      />
    </board>
  )
}

test("USB header pair wired through named nets", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  circuit.add(<UsbHeaderBoard />)
  await circuit.renderUntilSettled()
  expect(phases).toHaveLength(2)
  expect(phases[0]?.startSimpleRouteJson?.differentialPairs).toHaveLength(1)
  expect(phases[0]?.endSimpleRouteJson?.traces).toHaveLength(2)
  expect(circuit.db.pcb_trace.list()).toHaveLength(4)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
