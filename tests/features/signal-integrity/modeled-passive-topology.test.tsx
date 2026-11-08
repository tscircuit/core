import { expect, test } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI traverses a two-terminal diode with an explicit SPICE model", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard disconnected>
      <diode name="D5" footprint="sod123">
        <spicemodel
          source={".subckt ESD P N\nD1 P N esd\n.model esd D\n.ends ESD"}
          spicePinMapping={{ P: "anode", N: "cathode" }}
        />
      </diode>
      <trace from=".TX > .Y" to=".D5 > .anode" />
      <trace from=".D5 > .cathode" to=".RX > .A" />
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_signal.list()).toHaveLength(1)
  expect(circuit.db.simulation_spice_subcircuit.list()[0]).toMatchObject({
    source_component_id: circuit.db.source_component.getWhere({ name: "D5" })!
      .source_component_id,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
