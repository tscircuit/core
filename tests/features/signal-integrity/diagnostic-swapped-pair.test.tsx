import { simulation } from "lib/namespaced-elements"
import { Fragment } from "react"
import { expect } from "bun:test"
import { busModel, busPins } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: swapped legs in TI SN65HVD72 [Diff_pin]", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board routingDisabled fabricatorPreset="jlcpcb_standard">
      {["TX", "RX"].map((name) => (
        <Fragment key={name}>
          <chip name={name} footprint="soic8" pinLabels={busPins} />
          <simulation.ibismodel componentRef={`.${name}`} {...busModel} />
        </Fragment>
      ))}
      <trace from=".TX > .A" to=".RX > .A" />
      <trace from=".TX > .B" to=".RX > .B" />
      <simulation.pcbtransientchannelsimulation
        bitRate="250kbps"
        unrouted="ideal"
      >
        <simulation.pcbchannel
          name="BUS"
          driverRef={{ p: ".TX > .B", n: ".TX > .A" }}
          receiverRef={{ p: ".RX > .A", n: ".RX > .B" }}
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "BUS": .TX > .B is the inverting pin; swap p and n.',
  )
})
