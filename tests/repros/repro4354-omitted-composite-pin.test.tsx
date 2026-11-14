import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

beforeAll(async () => {
  circuit.add(
    <board width={26} height={16} routingDisabled>
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
              pcbY={1.5}
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
        text="U1.pin2: two pads omitted from schPinArrangement and pinLabels"
        pcbY={6}
        fontSize={0.5}
      />
      <pcbnotetext
        text="Expected: reject the trace to the omitted pin"
        pcbY={4.8}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_failed_to_create_component_error.list()).toEqual([])
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(2)

  const orphanPorts = circuit.db.source_port
    .list()
    .filter((port) => port.name !== "SIG")
  const missingPins = circuit.db.source_trace_not_connected_error
    .list()
    .flatMap((error) => error.selectors_not_found)
  for (const [text, pcbY] of [
    [`Orphan internal ports: ${orphanPorts.length} (expected 0)`, -4],
    [`Missing-pin diagnostic: ${missingPins.join(", ") || "none"}`, -5.2],
  ] as const) {
    circuit.db.pcb_note_text.insert({
      text,
      anchor_position: { x: 0, y: pcbY },
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.5,
    })
  }

  // Snapshot failures must still fail CI, independently of the known bug.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})

test("an omitted multi-pad pin cannot leave orphan ports that accept a trace", () => {
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
})
