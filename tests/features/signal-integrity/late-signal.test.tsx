import { expect } from "bun:test"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { Fragment } from "react"
import { lvcModel, lvcPins } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("adding a signal after initial render must emit its record", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board routingDisabled fabricatorPreset="jlcpcb_standard">
      {["TX0", "RX0", "TX1", "RX1"].map((name) => (
        <Fragment key={name}>
          <chip name={name} footprint="sot23_5" pinLabels={lvcPins} />
          <ibismodel componentRef={`.${name}`} {...lvcModel} />
        </Fragment>
      ))}
      <trace from=".TX0 > .Y" to=".RX0 > .A" />
      <trace from=".TX1 > .Y" to=".RX1 > .A" />
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="D0" driver=".TX0 > .Y" receiver=".RX0 > .A" />
      </signalintegrity>
    </board>,
  )
  await circuit.renderUntilSettled()
  const block = circuit.selectOne("signalintegrity")!
  block.add(
    createInstanceFromReactElement(
      <signal name="D1" driver=".TX1 > .Y" receiver=".RX1 > .A" />,
    ),
  )
  await circuit.renderUntilSettled()
  const emitted = circuit.db.simulation_signal
    .list()
    .map((signal) => signal.name)
  expect(emitted).toEqual(["D0", "D1"])
  expect(
    circuit.db.simulation_signal.list().map((signal) => signal.seed),
  ).toEqual([127, 7])
})
