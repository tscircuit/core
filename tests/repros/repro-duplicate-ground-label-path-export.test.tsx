import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: duplicate GND pin labels prevent saved route export", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const events: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => events.push(event))

  circuit.add(
    <board width={24} height={14}>
      <chip
        name="J1"
        pcbX={-6}
        pinLabels={{ pin1: "GND", pin2: "GND" }}
        noConnect={["pin1"]}
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
      <trace from="J1.pin2" to="R1.pin1" />
      <pcbnotetext
        pcbY={5}
        fontSize={0.6}
        text="Two GND pins, distinct pin numbers"
      />
      <pcbnotetext
        pcbY={3.5}
        fontSize={0.45}
        text="J1.pin2 -> R1.pin1 routes; saved-path export fails"
      />
      <pcbnotetext
        pcbX={-6}
        pcbY={2}
        fontSize={0.45}
        text="J1.pin1: GND (unused)"
      />
      <pcbnotetext
        pcbX={-6}
        pcbY={-2.5}
        fontSize={0.45}
        text="J1.pin2: GND (routed)"
      />
      <pcbnotetext
        pcbY={-4.5}
        fontSize={0.5}
        text="PCB port selector is not unique:"
      />
      <pcbnotetext
        pcbY={-5.5}
        fontSize={0.5}
        text=".J1 > port.GND matches both pins"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(events).toHaveLength(1)
  expect(events[0]!.pcbTracePaths).toBeUndefined()
  expect(events[0]!.pcbTracePathsUnavailableReason).toBe(
    "PCB port selector is not unique: .J1 > port.GND",
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
