import {
  LevelShifter_TXB0104,
  WirelessMCU_CC2745R10,
  WirelessMCU_CC3235SF,
} from "@tsci/tscircuit.ti"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro156: TI wireless subcircuits PCB autolayout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <WirelessMCU_CC3235SF name="radio_transceiver" />
      <LevelShifter_TXB0104 name="radio_level_shifter" />
      <WirelessMCU_CC2745R10 name="ble_module" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const footprintOverlapErrors = circuit.db.pcb_footprint_overlap_error.list()
  expect(footprintOverlapErrors).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
