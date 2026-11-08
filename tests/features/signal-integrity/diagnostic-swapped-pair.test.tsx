import { Fragment } from "react"
import { expect, test } from "bun:test"
import { busModel, busPins } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  ibisModelDirectory,
} from "./fixtures/get-si-test-fixture"

test.skipIf(!ibisModelDirectory)(
  "SI diagnostic: swapped legs in TI SN65HVD72 [Diff_pin]",
  async () => {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <board routingDisabled fabricatorPreset="jlcpcb_standard">
        {["TX", "RX"].map((name) => (
          <Fragment key={name}>
            <chip name={name} footprint="soic8" pinLabels={busPins} />
            <ibismodel componentRef={`.${name}`} {...busModel} />
          </Fragment>
        ))}
        <trace from=".TX > .A" to=".RX > .A" />
        <trace from=".TX > .B" to=".RX > .B" />
        <signalintegrity bitRate="250kbps" unrouted="ideal">
          <signal
            name="BUS"
            driver={{ p: ".TX > .B", n: ".TX > .A" }}
            receiver={{ p: ".RX > .A", n: ".RX > .B" }}
          />
        </signalintegrity>
      </board>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      'Signal "BUS": .TX > .B is the inverting pin; swap p and n.',
    )
  },
)
