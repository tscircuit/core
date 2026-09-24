import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reports inverted rails on the capacitor and sheet without changing connectivity", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board schTraceAutoLabelEnabled>
      <schematicsheet
        name="Power"
        displayName="Power"
        sheetIndex={0}
        sheetWidth="60mm"
        sheetHeight="40mm"
      >
        <capacitor name="C1" capacitance="100nF" schRotation={90} />
        <trace from=".C1 > .pin1" to="net.V3V3" />
        <trace from=".C1 > .pin2" to="net.GND" />
      </schematicsheet>
    </board>,
  )
  await circuit.renderUntilSettled()
  const source = circuit.db.source_component
    .list()
    .find((component) => component.name === "C1")!
  const component = circuit.db.schematic_component
    .list()
    .find(
      (component) =>
        component.source_component_id === source.source_component_id,
    )!
  const ports = circuit.db.schematic_port
    .list()
    .filter(
      (port) =>
        port.schematic_component_id === component.schematic_component_id,
    )
  const warnings = circuit.db.schematic_component_styling_warning
    .list()
    .filter((warning) => warning.styling_issue_type === "inverted_rails")
  expect(warnings).toEqual([
    expect.objectContaining({
      message:
        "C1 has its positive-supply connection below its ground connection. Rotate C1 by 180°, preserving pin connections, and reroute attached traces.",
      schematic_component_id: component.schematic_component_id,
      source_component_id: source.source_component_id,
      schematic_sheet_id:
        circuit.db.schematic_sheet.list()[0]!.schematic_sheet_id,
      subcircuit_id: circuit.db.schematic_group.get(
        component.schematic_group_id!,
      )!.subcircuit_id,
      schematic_port_ids: ports.map((port) => port.schematic_port_id),
    }),
  ])
  const positive = circuit.db.source_port
    .list()
    .find(
      (port) =>
        port.source_component_id === source.source_component_id &&
        port.name === "pin1",
    )!
  const ground = circuit.db.source_port
    .list()
    .find(
      (port) =>
        port.source_component_id === source.source_component_id &&
        port.name === "pin2",
    )!
  for (const [port, netName, facing] of [
    [positive, "V3V3", "down"],
    [ground, "GND", "up"],
  ] as const) {
    expect(
      ports.find(
        (schematicPort) => schematicPort.source_port_id === port.source_port_id,
      )?.facing_direction,
    ).toBe(facing)
    const net = circuit.db.source_net
      .list()
      .find((net) => net.name === netName)!
    expect(circuit.db.source_trace.list()).toContainEqual(
      expect.objectContaining({
        connected_source_port_ids: [port.source_port_id],
        connected_source_net_ids: [net.source_net_id],
      }),
    )
  }
  const rendered = structuredClone(circuit.getCircuitJson())
  await circuit.renderUntilSettled()
  expect(circuit.getCircuitJson()).toEqual(rendered)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
