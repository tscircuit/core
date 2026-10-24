import { expect, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { Port } from "lib/components/primitive-components/Port"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved-route export rejects repeated names without a unique selector alias", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const events: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => events.push(event))
  circuit.add(
    <board width={24} height={14}>
      <chip
        name="J1"
        pcbX={-6}
        pinLabels={{ pin1: ["GND", "pin2"], pin2: ["GND", "pin1"] }}
        noConnect={["2"]}
        footprint={
          <footprint>
            <smtpad
              portHints={["1"]}
              shape="rect"
              width={1}
              height={1}
              pcbY={1}
            />
            <smtpad
              portHints={["2"]}
              shape="rect"
              width={1}
              height={1}
              pcbY={-1}
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={5} pcbY={1} />
      <trace from="J1.1" to="R1.pin1" />
      <pcbnotetext
        pcbY={5}
        fontSize={0.6}
        text="GND and pin aliases are shared by both pads"
      />
      <pcbnotetext
        pcbY={3.5}
        fontSize={0.45}
        text="J1.1 routes; ambiguous saved selector must be rejected"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const ports = circuit.selectAll(".J1 > port.GND") as Port[]
  expect(ports).toHaveLength(2)
  expect(ports.map((port) => port.getPortSelector())).toEqual([
    ".J1 > port.GND",
    ".J1 > port.GND",
  ])
  expect(circuit.selectOne(".J1 > port.GND")).toBe(ports[0])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(events).toHaveLength(1)
  expect(events[0]!.pcbTracePaths).toBeUndefined()
  expect(events[0]!.pcbTracePathsUnavailableReason).toBe(
    "PCB port selector is not unique: .J1 > port.GND",
  )

  const board = circuit.firstChild as Board
  board.add(
    <pcbnotetext
      pcbY={-4.5}
      fontSize={0.5}
      text={events[0]!.pcbTracePathsUnavailableReason!}
    />,
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
