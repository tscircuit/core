import { expect, test } from "bun:test"
import type { FanoutTracePath } from "@tscircuit/props"
import { Chip } from "lib/components/normal-components/Chip"
import { Port } from "lib/components/primitive-components/Port"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function RepeatedPinLabelsBoard({
  pcbTracePaths,
}: {
  pcbTracePaths?: FanoutTracePath[]
}) {
  const pinLabels = { pin1: "GND", pin2: "GND" }
  return (
    <board width={24} height={14}>
      <chip
        name="J1"
        pcbX={-6}
        pinLabels={pinLabels}
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
      <autoroutingphase pcbTracePaths={pcbTracePaths} />
      <pcbnotetext
        pcbY={5}
        fontSize={0.6}
        text="Two GND pins, distinct physical pin numbers"
      />
      <pcbnotetext
        pcbY={3.5}
        fontSize={0.45}
        text={`J1.pin2 -> R1.pin1${pcbTracePaths ? ": saved route replayed" : ""}`}
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
    </board>
  )
}

test("saved route selects and replays GND pin 2", async () => {
  const connector = new Chip({ name: "J1" })
  const pin1 = new Port({ name: "GND", pinNumber: 1, aliases: ["ground.1"] })
  const pin2 = new Port({ name: "GND", pinNumber: 2, aliases: ["ground.2"] })
  connector.add(pin1)
  connector.add(pin2)
  expect(connector.selectAll(pin2.getPortSelector())).toEqual([pin2])

  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const events: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => events.push(event))
  circuit.add(<RepeatedPinLabelsBoard />)
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(events).toHaveLength(1)
  expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
  const paths = events[0]!.pcbTracePaths!
  expect(paths).toHaveLength(1)
  expect(paths[0]!.connection).toBe(".J1 > port.pin2")
  const routedPort = circuit.selectOne(".J1 > port.pin2")!
  expect(circuit.selectAll(paths[0]!.connection)).toEqual([routedPort])

  const { circuit: replay } = getTestFixture()
  replay.schematicDisabled = true
  replay.add(<RepeatedPinLabelsBoard pcbTracePaths={paths} />)
  await replay.renderUntilSettled()
  expect(replay.db.pcb_autorouting_error.list()).toEqual([])
  expect(replay.db.pcb_trace.list()).toHaveLength(1)
  expect(replay.db.pcb_trace.list()[0]!.route).toEqual(
    circuit.db.pcb_trace.list()[0]!.route,
  )
  await expect(replay).toMatchPcbSnapshot(import.meta.path)
})
