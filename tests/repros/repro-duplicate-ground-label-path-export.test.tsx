import { expect, test } from "bun:test"
import type { FanoutTracePath } from "@tscircuit/props"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function DuplicateGroundBoard({
  routedPinNumber,
  pcbTracePaths,
}: {
  routedPinNumber: 1 | 2
  pcbTracePaths?: FanoutTracePath[]
}) {
  return (
    <board width={24} height={14}>
      <chip
        name="J1"
        pcbX={-6}
        pinLabels={{ pin1: "GND", pin2: "GND" }}
        noConnect={[routedPinNumber === 1 ? "pin2" : "pin1"]}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width={1}
              height={1}
              pcbY={1}
            />
            <smtpad
              portHints={["pin2"]}
              shape="rect"
              width={1}
              height={1}
              pcbY={-1}
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={5} pcbY={-1} />
      <trace from={`J1.pin${routedPinNumber}`} to="R1.pin1" />
      <autoroutingphase pcbTracePaths={pcbTracePaths} />
      <pcbnotetext
        pcbY={5}
        fontSize={0.6}
        text="Two GND pins, distinct pin numbers"
      />
      <pcbnotetext
        pcbY={3.5}
        fontSize={0.45}
        text={`J1.pin${routedPinNumber} -> R1.pin1: route exported and replayed`}
      />
      <pcbnotetext pcbX={-6} pcbY={2} fontSize={0.45} text="J1.pin1: GND" />
      <pcbnotetext pcbX={-6} pcbY={-2.5} fontSize={0.45} text="J1.pin2: GND" />
      <pcbnotetext
        pcbY={-4.5}
        fontSize={0.5}
        text={`Saved selector: .J1 > port.pin${routedPinNumber}`}
      />
      <pcbnotetext
        pcbY={-5.5}
        fontSize={0.5}
        text="Selects one physical pin; both GND labels preserved"
      />
    </board>
  )
}

test("saved routes distinguish connector pins with repeated GND labels", async () => {
  for (const routedPinNumber of [1, 2] as const) {
    const { circuit } = getTestFixture()
    circuit.schematicDisabled = true
    const events: AutoroutingEndEvent[] = []
    circuit.on("autorouting:end", (event) => events.push(event))
    circuit.add(<DuplicateGroundBoard routedPinNumber={routedPinNumber} />)
    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
    expect(events).toHaveLength(1)
    expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
    const paths = events[0]!.pcbTracePaths!
    expect(paths).toHaveLength(1)
    expect(paths[0]!.connection).toBe(`.J1 > port.pin${routedPinNumber}`)
    expect(circuit.selectAll(paths[0]!.connection)).toHaveLength(1)

    const { circuit: replay } = getTestFixture()
    replay.schematicDisabled = true
    replay.add(
      <DuplicateGroundBoard
        routedPinNumber={routedPinNumber}
        pcbTracePaths={paths}
      />,
    )
    await replay.renderUntilSettled()
    expect(replay.db.pcb_autorouting_error.list()).toEqual([])
    expect(replay.db.pcb_trace.list()).toHaveLength(1)
    expect(replay.db.pcb_trace.list()[0]!.route).toEqual(
      circuit.db.pcb_trace.list()[0]!.route,
    )
    if (routedPinNumber === 2) {
      await expect(replay).toMatchPcbSnapshot(import.meta.path)
    }
  }
})
