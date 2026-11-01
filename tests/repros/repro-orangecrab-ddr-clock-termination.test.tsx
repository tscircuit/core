import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port/Port"
import {
  orangeCrabClockSnapshotOptions,
  renderOrangeCrabDdrClock,
} from "tests/fixtures/orangecrab-ddr-clock/render"

test("records the unresolved full OrangeCrab clock and termination route", async () => {
  const { circuit, inputs, outputs, asyncErrors, phaseNames } =
    await renderOrangeCrabDdrClock(true)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(387)
  expect(
    circuit.db.pcb_smtpad.list().filter((pad) => pad.shape === "circle"),
  ).toHaveLength(381)
  expect(circuit.db.source_trace.list()).toHaveLength(54)
  // Independent board-world coordinates from the pinned native PCB (mm).
  const nativeClockPads = [
    { selector: ".U3 > .BALL_J18", x: 1.54, y: -2.200001 },
    { selector: ".U3 > .BALL_K18", x: 1.04, y: -2.200001 },
    { selector: ".U4 > .BALL_J7", x: 13.34, y: 0.95 },
    { selector: ".U4 > .BALL_K7", x: 13.34, y: 1.75 },
    { selector: ".R5 > .pin1", x: 18.72, y: 0.17 },
    { selector: ".C27 > .pin1", x: 19.6, y: 0.25 },
  ]
  for (const pad of nativeClockPads) {
    const port = circuit.firstChild!.selectOne<Port>(pad.selector)!
    const pcbPort = circuit.db.pcb_port.getWhere({
      source_port_id: port.source_port_id!,
    })!
    expect(pcbPort.x).toBeCloseTo(pad.x, 7)
    expect(pcbPort.y).toBeCloseTo(pad.y, 7)
  }
  expect(phaseNames).toEqual(["CLOCK_TRUNKS", "TERMINATION_TAPS"])
  expect(inputs.map((input) => input.connections.length)).toEqual([2, 4])
  expect(outputs).toHaveLength(1)
  expect(outputs[0].traces).toHaveLength(2)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(asyncErrors).toEqual([
    expect.stringContaining("no bordering routing edge"),
  ])
  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path,
    orangeCrabClockSnapshotOptions,
  )
}, 60_000)
