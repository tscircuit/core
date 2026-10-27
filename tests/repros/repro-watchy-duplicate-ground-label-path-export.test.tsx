import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { AutoroutingEndEvent } from "lib/events"
import { getPcbSvgPixelParity } from "tests/fixtures/get-pcb-svg-pixel-parity"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import WatchyEinkSmartwatch from "./fixtures/watchy-eink-smartwatch.fixture"

test("Watchy J3 repeated GND labels export and replay saved routes", async () => {
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
  expect(events).toHaveLength(1)
  expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
  const paths = events[0]!.pcbTracePaths!
  expect(paths.length).toBeGreaterThan(0)
  for (const path of paths) {
    expect(circuit.selectAll(path.connection)).toHaveLength(1)
  }
  expect(paths.some((path) => path.connection === ".J3 > port.pin17")).toBe(
    true,
  )

  const { circuit: replay } = getTestFixture({
    platform: { partsEngineDisabled: true },
  })
  const routers: string[] = []
  replay.on("autorouting:start", (event) => routers.push(event.autorouterName!))
  replay.add(
    <WatchyEinkSmartwatch pcbTracePaths={JSON.parse(JSON.stringify(paths))} />,
  )
  await replay.renderUntilSettled()
  expect(routers).toEqual(["precomputed"])
  expect(replay.db.pcb_autorouting_error.list()).toEqual([])
  expect(replay.db.pcb_trace.list()).toHaveLength(
    circuit.db.pcb_trace.list().length,
  )
  expect(replay.db.pcb_via.list()).toHaveLength(
    circuit.db.pcb_via.list().length,
  )
  const parity = getPcbSvgPixelParity(
    convertCircuitJsonToPcbSvg(circuit.getCircuitJson()),
    convertCircuitJsonToPcbSvg(replay.getCircuitJson()),
  )
  expect(parity.differentPixels).toBe(0)

  const board = replay.firstChild as Board
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
      text={`${paths.length} saved routes replayed; J3.pin17 selects one GND pin`}
    />,
  )
  await expect(replay).toMatchPcbSnapshot(import.meta.path)
}, 180_000)
