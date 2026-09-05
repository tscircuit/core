import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import UsbBreakoutBoard from "./usb-c-breakout/board"

test("USB-C breakout pair wired through named nets", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<UsbBreakoutBoard />)
  await circuit.renderUntilSettled()
  expect(circuit.db.source_failed_to_create_component_error.list()).toEqual([])
  expect(circuit.db.source_trace_not_connected_error.list()).toEqual([])
  const board = circuit.firstChild
  if (!board) throw new Error("Expected USB-C breakout board")
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: board,
    }),
  ).toThrow(
    'Could not find an SRJ connection for trace name or port selector ".R3 > .pin1"',
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
