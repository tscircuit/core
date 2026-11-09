import { signalintegrity } from "lib/namespaced-elements"
import { Fragment } from "react"
import { expect } from "bun:test"
import { busModel, busPins } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("Unlisted receive-capable IBIS pins receive even with a schematic output attribute", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board routingDisabled fabricatorPreset="jlcpcb_standard">
      {["TX", "RX", "U3"].map((name) => (
        <Fragment key={name}>
          <chip
            name={name}
            footprint="soic8"
            pinLabels={busPins}
            pinAttributes={
              name === "U3" ? { A: { isOutput: true } } : undefined
            }
          />
          <signalintegrity.ibismodel componentRef={`.${name}`} {...busModel} />
        </Fragment>
      ))}
      <trace from=".TX > .A" to=".RX > .A" />
      <trace from=".TX > .A" to=".U3 > .A" />
      <signalintegrity.simulation bitRate="250kbps" unrouted="ideal">
        <signalintegrity.signal
          name="BUS"
          driverRef=".TX > .A"
          receiverRef=".RX > .A"
        />
      </signalintegrity.simulation>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_signal.list()).toHaveLength(1)
})
