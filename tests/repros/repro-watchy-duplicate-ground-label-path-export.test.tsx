import { expect, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import WatchyEinkSmartwatch from "./fixtures/watchy-eink-smartwatch.fixture"

test("Watchy J3 repeated labels prevent saved route export", async () => {
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
  const { pcbTracePaths, pcbTracePathsUnavailableReason: reason } = events[0]!
  expect(pcbTracePaths).toBeUndefined()
  const prefix = "PCB port selector is not unique: "
  expect(reason).toStartWith(prefix)
  expect(
    circuit.selectAll(reason!.slice(prefix.length)).length,
  ).toBeGreaterThan(1)

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
