import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import {
  SignalIntegritySignal,
  SignalIntegritySimulation,
} from "lib/components"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI updates and removes records without duplicating runs or mutating props", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <signalintegrity.simulation bitRate="20Mbps" unrouted="ideal">
        <signalintegrity.signal
          name="DATA"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
        />
      </signalintegrity.simulation>
    </DiagnosticBoard>,
  )
  await circuit.renderUntilSettled()
  const block = circuit.selectOne(
    "signalintegritysimulation",
  ) as SignalIntegritySimulation
  const signal = circuit.selectOne(
    "signalintegritysignal",
  ) as SignalIntegritySignal
  const originalProps = structuredClone(signal._parsedProps)
  const originalId = signal.simulation_signal_id
  signal.setProps({
    ...signal.props,
    quiet: "high",
    pattern: "prbs31",
    offset: "1UI",
  })
  block.setProps({
    ...block.props,
    bitRate: "10Mbps",
    duration: "20UI",
    corner: "minimum",
  })
  await circuit.renderUntilSettled()
  expect(signal.simulation_signal_id).toBe(originalId)
  expect(circuit.db.simulation_signal.list()).toHaveLength(1)
  expect(circuit.db.simulation_signal.list()[0]).toMatchObject({
    quiet: "high",
    pattern: "prbs31",
    bit_rate_bps: 10e6,
    offset_s: 1 / 10e6,
  })
  expect(circuit.db.simulation_signal_integrity.list()[0]).toMatchObject({
    duration_s: 20 / 10e6,
    corner: "min",
  })
  expect(originalProps).toMatchObject({ pattern: "prbs7", offset: "0UI" })
  block.shouldBeRemoved = true
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
  expect(circuit.db.simulation_signal_integrity.list()).toHaveLength(0)
})
