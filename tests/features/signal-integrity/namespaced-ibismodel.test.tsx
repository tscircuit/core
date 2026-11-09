import { expect } from "bun:test"
import { signalintegrity } from "lib/namespaced-elements"
import { catalogue } from "lib/fiber/catalogue"
import { DiagnosticBoard, lvcModel } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("namespaced IBIS models work with signals at every corner", async () => {
  for (const removedHost of ["ibismodel", "signalintegrity", "signal"]) {
    expect(catalogue).not.toHaveProperty(removedHost)
  }
  for (const [corner, serializedCorner] of [
    ["typical", "typ"],
    ["minimum", "min"],
    ["maximum", "max"],
  ] as const) {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <DiagnosticBoard missingModel="TX">
        <signalintegrity.ibismodel componentRef=".TX" {...lvcModel} />
        <signalintegrity.simulation
          bitRate="20Mbps"
          unrouted="ideal"
          corner={corner}
        >
          <signalintegrity.signal
            name="DATA"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
          />
        </signalintegrity.simulation>
      </DiagnosticBoard>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.simulation_ibis_model.list()).toHaveLength(2)
    expect(circuit.db.simulation_signal.list()).toHaveLength(1)
    expect(circuit.db.simulation_signal_integrity.list()[0].corner).toBe(
      serializedCorner,
    )
  }
})
