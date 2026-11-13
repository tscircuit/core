import { expect } from "bun:test"
import { simulation } from "lib/namespaced-elements"
import { catalogue } from "lib/fiber/catalogue"
import { DiagnosticBoard, lvcModel } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("namespaced IBIS models work with the no-enums channel API", async () => {
  for (const removedHost of [
    "ibismodel",
    "signalintegrity",
    "signal",
    "pcbchannel",
    "pcbtransientchannelsimulation",
    "signalintegrity.simulation",
    "signalintegrity.signal",
    "signalintegrity.ibismodel",
    "signalintegritysimulation",
    "signalintegritysignal",
    "signalintegrityibismodel",
  ]) {
    expect(catalogue).not.toHaveProperty(removedHost)
  }
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard missingModel="TX">
      <simulation.ibismodel componentRef=".TX" {...lvcModel} />
      <simulation.pcbtransientchannelsimulation
        bitRate="20Mbps"
        allowUnroutedTraces
      >
        <simulation.pcbchannel
          name="DATA"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
        />
      </simulation.pcbtransientchannelsimulation>
    </DiagnosticBoard>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_ibis_model.list()).toHaveLength(2)
  expect(circuit.db.simulation_signal.list()).toHaveLength(1)
  expect(circuit.db.simulation_signal_integrity.list()[0]).not.toHaveProperty(
    "corner",
  )
})
