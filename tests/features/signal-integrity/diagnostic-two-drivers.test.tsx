import { simulation } from "lib/namespaced-elements"
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
          <simulation.ibismodel componentRef={`.${name}`} {...busModel} />
        </Fragment>
      ))}
      <trace from=".TX > .A" to=".RX > .A" />
      <trace from=".TX > .A" to=".U3 > .A" />
      <simulation.pcbtransientchannelsimulation
        bitRate="250kbps"
        allowUnroutedTraces
      >
        <simulation.pcbchannel
          name="BUS"
          driverRef=".TX > .A"
          receiverRef=".RX > .A"
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_signal.list()).toHaveLength(1)
})
