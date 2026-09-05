import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import UsbBreakoutBoard from "./usb-c-breakout/board"

test("USB-C breakout pair wired through named nets", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  circuit.add(<UsbBreakoutBoard />)
  await circuit.renderUntilSettled()
  expect(circuit.db.source_failed_to_create_component_error.list()).toEqual([])
  expect(circuit.db.source_trace_not_connected_error.list()).toEqual([])
  expect(phases).toHaveLength(2)
  expect(phases[0]?.startSimpleRouteJson?.differentialPairs).toHaveLength(1)
  expect(phases[0]?.endSimpleRouteJson?.traces).toHaveLength(2)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  await expect(phases).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "usb-c-breakout-routing-phases",
    circuit,
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
