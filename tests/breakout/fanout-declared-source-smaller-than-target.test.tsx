import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a local fanout keeps its declared chip when the destination BGA is larger", async () => {
  const { circuit } = getTestFixture()
  const fanoutStarts: SolverStartedEvent[] = []
  circuit.on("solver:started", (event) => {
    if (event.solverName === "FanoutSolver") fanoutStarts.push(event)
  })
  const pads = (side: number) => (
    <footprint>
      {Array.from({ length: side * side }, (_, index) => (
        <Fragment key={index}>
          <smtpad
            portHints={[`pin${index + 1}`]}
            shape="circle"
            radius={0.15}
            pcbX={(index % side) * 0.8 - ((side - 1) * 0.8) / 2}
            pcbY={Math.floor(index / side) * 0.8 - ((side - 1) * 0.8) / 2}
          />
        </Fragment>
      ))}
    </footprint>
  )
  circuit.add(
    <board width={16} height={10} layers={4} schematicDisabled>
      <fanout name="RAM_ESCAPE" pcbX={-4} padding={0.6}>
        <chip name="RAM" footprint={pads(2)} />
      </fanout>
      <chip name="CPU" pcbX={4} footprint={pads(3)} />
      <trace name="DATA" from=".RAM > .pin1" to=".CPU > .pin1" />
      <pcbnotetext
        pcbY={3.5}
        text="RAM fanout owns the smaller BGA"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const ram = circuit.db.source_component.getWhere({ name: "RAM" })!
  const ramPcb = circuit.db.pcb_component.getWhere({
    source_component_id: ram.source_component_id,
  })!
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(fanoutStarts).toHaveLength(1)
  expect(fanoutStarts[0]!.solverConstructorArgs[1]).toMatchObject({
    sourceComponentId: ramPcb.pcb_component_id,
  })
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
