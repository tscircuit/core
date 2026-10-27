import { expect, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import WatchyEinkSmartwatch from "./fixtures/watchy-eink-smartwatch.fixture"

test("Watchy J3 repeated GND labels prevent saved route export", async () => {
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
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  const exportFailure = events.find((event) =>
    event.pcbTracePathsUnavailableReason?.includes(".J3 > port.GND"),
  )
  expect(exportFailure).toBeDefined()
  expect(exportFailure!.pcbTracePaths).toBeUndefined()
  expect(exportFailure!.pcbTracePathsUnavailableReason).toBe(
    "PCB port selector is not unique: .J3 > port.GND",
  )

  const board = circuit.firstChild as Board
  board.add(
    <pcbnotetext
      pcbY={29}
      fontSize={0.8}
      text="Watchy v1.2.12: J3 pins 8 and 17 are GND"
    />,
  )
  board.add(
    <pcbnotetext
      pcbY={27}
      fontSize={0.7}
      text={exportFailure!.pcbTracePathsUnavailableReason!}
    />,
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 180_000)
