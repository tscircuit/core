import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton terminal aliases preserve explicit labels and rotations", () => {
  const { circuit } = getTestFixture()
  let input: InputProblem | undefined
  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      input = event.solverParams as InputProblem
    }
  })
  const pinGroups = [
    [
      [1, 2],
      [3, 4],
    ],
    [
      ["B", "A"],
      ["D", "C"],
    ],
    [
      ["pin1", "pin3"],
      ["pin2", "pin4"],
    ],
    [
      ["pin4", "pin1"],
      ["pin3", "pin2"],
    ],
  ]
  circuit.add(
    <board schMaxTraceDistance={1}>
      <schematictext
        text="Four pads, two terminals; one explicit signal label per switch"
        schX={3}
        schY={2}
        fontSize={0.2}
      />
      {pinGroups.map((internallyConnectedPins, i) => {
        const signalAlias = ["B", "B", "C", "D"][i]
        const groundOwner = ["C", "C", "B", "B"][i]
        const groundAlias = ["D", "D", "D", "C"][i]
        return (
          <Fragment key={i}>
            <pushbutton
              name={`SW${i}`}
              schX={(i % 2) * 6}
              schY={-Math.floor(i / 2) * 6}
              schRotation={i * 90}
              pinLabels={{ pin1: "A", pin2: "B", pin3: "C", pin4: "D" }}
              internallyConnectedPins={internallyConnectedPins}
              footprint="smdpushbutton4_px6mm_py3.7mm_pw1mm_ph0.75mm"
            />
            <netlabel net={`BOOT${i}`} connection={`SW${i}.${signalAlias}`} />
            <trace from={`SW${i}.${groundAlias}`} to="net.GND" />
            <trace from={`SW${i}.${signalAlias}`} to={`SW${i}.A`} />
            <trace
              from={`SW${i}.${groundAlias}`}
              to={`SW${i}.${groundOwner}`}
            />
          </Fragment>
        )
      })}
    </board>,
  )
  circuit.render()
  expect(input!.chips.map((chip) => chip.pins.length)).toEqual([2, 2, 2, 2])
  expect(input!.directConnections).toHaveLength(0)
  expect(
    circuit.db.schematic_text.list().filter((text) => text.source_trace_id),
  ).toHaveLength(0)
  for (let i = 0; i < 4; i++) {
    expect(
      circuit.db.schematic_net_label
        .list()
        .filter((label) => label.text === `BOOT${i}`),
    ).toHaveLength(1)
  }
  for (const chip of input!.chips) {
    const ports = circuit.db.schematic_port.list({
      schematic_component_id: chip.chipId,
    })
    const statesByTerminal = new Map<string, boolean | undefined>()
    for (const port of ports) {
      const key = JSON.stringify(port.center)
      if (statesByTerminal.has(key)) {
        expect(port.is_connected).toBe(statesByTerminal.get(key))
      }
      statesByTerminal.set(key, port.is_connected)
    }
    expect(statesByTerminal.size).toBe(2)
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
