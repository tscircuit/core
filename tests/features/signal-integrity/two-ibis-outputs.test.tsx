import { expect } from "bun:test"
import { DiagnosticBoard, lvcModel, lvcPins } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI detects an additional Output-only pin from the real TI IBIS model", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <chip name="U3" footprint="sot23_5" pinLabels={lvcPins} />
      <ibismodel componentRef=".U3" {...lvcModel} />
      <trace from=".TX > .Y" to=".U3 > .Y" />
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "DATA" has two drivers: .TX > .Y and .U3 > .Y. Exactly one pin drives a signal.',
  )
})
