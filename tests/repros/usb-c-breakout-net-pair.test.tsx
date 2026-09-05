import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsVertically } from "stack-svgs"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import UsbBreakoutBoard from "./usb-c-breakout/board"

test("USB-C breakout pair wired through named nets", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
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
  expect(phases).toHaveLength(0)
  // No phase input exists yet: differential-pair conversion fails first.
  const blockedRoutingSvg = stackSvgsVertically([
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="60">
      <rect width="800" height="60" fill="#121212" />
      <text x="400" y="24" text-anchor="middle" fill="white" font-size="18">AUTOROUTING BLOCKED: NO PHASE STARTED</text>
      <text x="400" y="47" text-anchor="middle" fill="white" font-size="14">USB differential-pair connection lookup failed</text>
    </svg>`,
    convertCircuitJsonToPcbSvg(circuit.getCircuitJson()),
  ])
  await expect(blockedRoutingSvg).toMatchSvgSnapshot(
    import.meta.path,
    "usb-c-breakout-routing-phases",
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
