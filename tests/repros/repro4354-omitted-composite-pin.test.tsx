import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

const shellFootprint = (
  <footprint>
    <smtpad
      portHints={["pin1"]}
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
)

beforeAll(async () => {
  circuit.add(
    <board width={32} height={16} autorouter="auto-local">
      <chip
        name="U1"
        pcbX={-8}
        schX={-4}
        footprint={shellFootprint}
        pinLabels={{ pin1: "SIG" }}
        schPinArrangement={{
          rightSide: { direction: "top-to-bottom", pins: ["SIG"] },
        }}
      />
      <chip
        name="U2"
        pcbX={8}
        schX={4}
        footprint={shellFootprint}
        pinLabels={{ pin1: "SIG" }}
        schPinArrangement={{
          rightSide: { direction: "top-to-bottom", pins: ["SIG", "pin2"] },
        }}
      />
      <testpoint
        name="TP1"
        pcbY={-1.5}
        schY={-3}
        footprintVariant="pad"
        padShape="rect"
        width={1.8}
      />
      <trace name="U1_GND" from="U1.pin2" to="net.GND" />
      <trace from="U2.pin2" to="net.GND" />
      <trace from="TP1.pin1" to="net.GND" />
      <pcbnotetext
        text="Requested on both sides: pin2 to GND"
        pcbY={6.5}
        fontSize={0.8}
        color="#e2f0ff"
      />
      <pcbnotetext
        text="U1 | pin2 omitted from arrangement"
        pcbX={-8}
        pcbY={4.5}
        fontSize={0.72}
      />
      <pcbnotetext
        text="U2 | pin2 in arrangement"
        pcbX={8}
        pcbY={4.5}
        fontSize={0.72}
      />
      <pcbnotetext text="GND" pcbY={0.85} fontSize={0.65} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_failed_to_create_component_error.list()).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const omittedHoles = getShellHoles("U1")
  const retainedHoles = getShellHoles("U2")
  expect(omittedHoles).toHaveLength(2)
  expect(omittedHoles.filter((hole) => hole.pcb_port_id)).toHaveLength(0)
  expect(retainedHoles).toHaveLength(2)
  expect(retainedHoles.every((hole) => hole.pcb_port_id)).toBe(true)

  const groundTrace = circuit.db.source_trace.getWhere({
    display_name: "U2.pin2 to net.GND",
  })!
  expect(
    circuit.db.pcb_trace.list().map((trace) => trace.source_trace_id),
  ).toEqual([groundTrace.source_trace_id])

  const acceptedTrace = circuit.db.source_trace.getWhere({ name: "U1_GND" })
  const resolvedPortNames = acceptedTrace?.connected_source_port_ids
    .map((portId) => circuit.db.source_port.get(portId)!.name)
    .join(", ")
  const missingPin = circuit.db.source_trace_not_connected_error
    .list()
    .some((error) => error.selectors_not_found.includes("U1.pin2"))

  // Note anchor points in mm, in the right-handed board frame viewed from
  // above (+Z), with +X right and +Y up.
  for (const [text, x, y] of [
    ["Shell holes with PCB ports: 0/2", -8, -3.7],
    ["Shell holes with PCB ports: 2/2", 8, -3.7],
    ["Copper reaches the GND pad", 8, -5],
    [
      resolvedPortNames
        ? `GND trace resolves to ${resolvedPortNames}`
        : "GND trace rejected",
      -8,
      -5,
    ],
    [missingPin ? "Missing pin: U1.pin2" : "No missing-pin error", -8, -6.3],
  ] as const) {
    circuit.db.pcb_note_text.insert({
      text,
      anchor_position: { x, y },
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.62,
      color: "#90d1ff",
    })
  }

  // Snapshot failures must still fail CI, independently of the known bug.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})

function getShellHoles(chipName: "U1" | "U2") {
  const chip = circuit.db.source_component.getWhere({ name: chipName })!
  const pcbChip = circuit.db.pcb_component.getWhere({
    source_component_id: chip.source_component_id,
  })!
  return circuit.db.pcb_plated_hole.list({
    pcb_component_id: pcbChip.pcb_component_id,
  })
}

test.failing(
  "an omitted multi-pad pin cannot leave orphan ports that accept a trace",
  () => {
    const chip = circuit.db.source_component.getWhere({ name: "U1" })!
    expect(
      circuit.db.source_port
        .list({ source_component_id: chip.source_component_id })
        .map((port) => port.name),
    ).toEqual(["SIG"])
    expect(
      circuit.db.source_component_internal_connection.list({
        source_component_id: chip.source_component_id,
      }),
    ).toHaveLength(0)
    expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
    expect(
      circuit.db.source_trace_not_connected_error
        .list()
        .map((error) => error.selectors_not_found),
    ).toEqual([["U1.pin2"]])
  },
)
