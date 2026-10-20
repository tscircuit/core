import { expect, test } from "bun:test"
import type { FanoutTracePath } from "@tscircuit/props"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function RepeatedPinLabelsBoard({
  routedPinNumber,
  pcbTracePaths,
  pinLabels,
}: {
  routedPinNumber: 1 | 2
  pinLabels: { pin1: string; pin2: string }
  pcbTracePaths?: FanoutTracePath[]
}) {
  return (
    <board width={24} height={14}>
      <chip
        name="J1"
        pcbX={-6}
        pinLabels={pinLabels}
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
        text="Pin labels preserved; physical pins selected uniquely"
      />
      <pcbnotetext
        pcbY={3.5}
        fontSize={0.45}
        text={`J1.pin${routedPinNumber} -> R1.pin1${pcbTracePaths ? ": saved route replayed" : ""}`}
      />
      <pcbnotetext
        pcbX={-6}
        pcbY={2}
        fontSize={0.45}
        text={`J1.pin1: ${pinLabels.pin1}`}
      />
      <pcbnotetext
        pcbX={-6}
        pcbY={-2.5}
        fontSize={0.45}
        text={`J1.pin2: ${pinLabels.pin2}`}
      />
      <pcbnotetext
        pcbY={-4.5}
        fontSize={0.5}
        text={`Saved selector: ${pcbTracePaths?.[0]?.connection ?? "not exported yet"}`}
      />
      <pcbnotetext
        pcbY={-5.5}
        fontSize={0.5}
        text="Replayed copper matches the original route"
      />
    </board>
  )
}

test("saved routes distinguish repeated pin labels and preserve unique labels", async () => {
  for (const pinLabels of [
    { pin1: "GND", pin2: "GND" },
    { pin1: "VCC", pin2: "VCC" },
    { pin1: "GND", pin2: "VCC" },
  ]) {
    for (const routedPinNumber of [1, 2] as const) {
      const { circuit } = getTestFixture()
      circuit.schematicDisabled = true
      const events: AutoroutingEndEvent[] = []
      circuit.on("autorouting:end", (event) => events.push(event))
      circuit.add(
        <RepeatedPinLabelsBoard
          routedPinNumber={routedPinNumber}
          pinLabels={pinLabels}
        />,
      )
      await circuit.renderUntilSettled()

      expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
      expect(circuit.db.pcb_trace.list()).toHaveLength(1)
      expect(events).toHaveLength(1)
      expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
      const paths = events[0]!.pcbTracePaths!
      expect(paths).toHaveLength(1)
      const routedPort = circuit.selectOne(`.J1 > port.pin${routedPinNumber}`)!
      const expectedPortName =
        pinLabels.pin1 === pinLabels.pin2
          ? `pin${routedPinNumber}`
          : pinLabels[`pin${routedPinNumber}`]
      expect(paths[0]!.connection).toBe(`.J1 > port.${expectedPortName}`)
      expect(circuit.selectAll(paths[0]!.connection)).toEqual([routedPort])

      const { circuit: replay } = getTestFixture()
      replay.schematicDisabled = true
      replay.add(
        <RepeatedPinLabelsBoard
          routedPinNumber={routedPinNumber}
          pcbTracePaths={paths}
          pinLabels={pinLabels}
        />,
      )
      await replay.renderUntilSettled()
      expect(replay.db.pcb_autorouting_error.list()).toEqual([])
      expect(replay.db.pcb_trace.list()).toHaveLength(1)
      expect(replay.db.pcb_trace.list()[0]!.route).toEqual(
        circuit.db.pcb_trace.list()[0]!.route,
      )
      if (pinLabels.pin1 === "GND" && pinLabels.pin2 === "GND") {
        await expect(replay).toMatchPcbSnapshot(
          routedPinNumber === 2
            ? import.meta.path
            : import.meta.path.replace(".test.tsx", "-pin1.test.tsx"),
        )
      }
    }
  }
})
