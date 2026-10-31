import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic pin arrangement that leaves out a composite pin creates no orphan pad ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={16} height={10} routingDisabled>
      <chip
        name="U1"
        pinLabels={{ pin1: "SIG" }}
        schPinArrangement={{
          rightSide: { direction: "top-to-bottom", pins: ["SIG"] },
        }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={0}
              pcbY={1}
              width={0.6}
              height={1}
              shape="rect"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX={-2}
              pcbY={-1.5}
              shape="circle"
              holeDiameter={0.8}
              outerDiameter={1.4}
            />
            <platedhole
              portHints={["pin2"]}
              pcbX={2}
              pcbY={-1.5}
              shape="circle"
              holeDiameter={0.8}
              outerDiameter={1.4}
            />
          </footprint>
        }
      />
      <trace from="U1.pin2" to="net.GND" />
      <pcbnotetext
        text="pin2 has two plated holes and is not in schPinArrangement"
        pcbY={3.5}
        fontSize={0.4}
      />
      <pcbnotetext
        text="pin2 gets no ports, so the trace to U1.pin2 reports a missing pin"
        pcbY={-3.5}
        fontSize={0.4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_port.list().map((port) => port.name)).toEqual([
    "SIG",
  ])
  expect(circuit.db.source_component_internal_connection.list()).toHaveLength(0)
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(
    circuit.db.source_trace_not_connected_error
      .list()
      .map((error) => error.selectors_not_found),
  ).toEqual([["U1.pin2"]])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
