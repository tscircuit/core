import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic arrangements retain separate copper terminals without adding other pins", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={18} height={14}>
      <chip
        name="U1"
        pinLabels={{ pin1: "SIG" }}
        schPinArrangement={{
          leftSide: { pins: [1], direction: "top-to-bottom" },
        }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              portHints={["pin1"]}
              pcbX={-3}
              width={1}
              height={1}
            />
            <smtpad
              shape="rect"
              portHints={["pin1"]}
              pcbX={3}
              width={1}
              height={1}
            />
            <smtpad
              shape="rect"
              portHints={["pin2"]}
              pcbY={4}
              width={1}
              height={1}
            />
          </footprint>
        }
      />
      <pcbnotetext
        pcbY={-3}
        text="SIG: two internal copper terminals"
        fontSize={0.6}
      />
      <pcbnotetext
        pcbY={6}
        text="Pin 2 excluded by schematic arrangement"
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_port.list().map((port) => port.name)).toEqual([
    "SIG",
    "pin1_internal_1",
  ])
  expect(circuit.db.pcb_port.list()).toHaveLength(2)
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(
    circuit.db.schematic_port.list().map((port) => port.pin_number),
  ).toEqual([1])
  expect(
    circuit.db.source_component_internal_connection
      .list()[0]
      .source_port_ids.toSorted(),
  ).toEqual(
    circuit.db.source_port
      .list()
      .map((port) => port.source_port_id)
      .toSorted(),
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
