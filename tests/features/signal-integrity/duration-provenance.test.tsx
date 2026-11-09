import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import type { PcbTransientChannelSimulation } from "lib/components"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("explicit duration stays a user bound and clearing it restores absence", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <simulation.pcbtransientchannelsimulation
        bitRate="20Mbps"
        unrouted="ideal"
        duration="2UI"
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
  const block = circuit.selectOne(
    "pcbtransientchannelsimulation",
  ) as PcbTransientChannelSimulation
  expect(circuit.db.simulation_signal_integrity.list()[0].duration_s).toBe(
    2 / 20e6,
  )
  block.setProps({ ...block.props, duration: undefined })
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_signal_integrity.list()[0]).not.toHaveProperty(
    "duration_s",
  )
})
