import { expect, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import WatchyEinkSmartwatch from "./fixtures/watchy-eink-smartwatch.fixture"

test("Watchy repeated connector labels prevent saved route export", async () => {
  const { circuit } = getTestFixture({
    platform: { partsEngineDisabled: true },
  })
  const events: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => events.push(event))
  circuit.add(<WatchyEinkSmartwatch />)
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_component_outside_board_error.list()).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.selectAll(".J3 > port.GND")).toHaveLength(2)
  expect(circuit.selectAll(".J3 > port.P3V3")).toHaveLength(2)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  expect(events).toHaveLength(1)
  const exportFailure = events[0]!
  expect(exportFailure.pcbTracePaths).toBeUndefined()
  const reason = exportFailure.pcbTracePathsUnavailableReason
  expect(reason).toBeDefined()
  const prefix = "PCB port selector is not unique: "
  expect(reason!.startsWith(prefix)).toBe(true)
  // Both GND and P3V3 are ambiguous. Which is visited first is not part of
  // the export contract; the reported selector must identify a real ambiguity.
  const reportedPorts = circuit.selectAll(reason!.slice(prefix.length))
  expect(reportedPorts.length).toBeGreaterThan(1)

  const board = circuit.firstChild as Board
  board.add(
    <pcbnotetext
      pcbY={29}
      fontSize={0.8}
      text="Watchy v1.2.12: J3 repeats GND and P3V3"
    />,
  )
  board.add(
    <pcbnotetext
      pcbY={27}
      fontSize={0.7}
      text="Saved route export rejects ambiguous PCB port selectors"
    />,
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 180_000)
