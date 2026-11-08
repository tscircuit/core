import { Fragment } from "react"
import { expect, test } from "bun:test"
import { busModel, busPins } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI diagnostic: second driving pin on the topology", async () => {
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
          <ibismodel componentRef={`.${name}`} {...busModel} />
        </Fragment>
      ))}
      <trace from=".TX > .A" to=".RX > .A" />
      <trace from=".TX > .A" to=".U3 > .A" />
      <signalintegrity bitRate="250kbps" unrouted="ideal">
        <signal name="BUS" driver=".TX > .A" receiver=".RX > .A" />
      </signalintegrity>
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "BUS" has two drivers: .TX > .A and .U3 > .A. Exactly one pin drives a signal.',
  )
})
