import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("source_port and source_net subcircuit_connectivity_map_key are populated", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" name="board">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={0}
        pcbY={2}
      />
      <net name="VCC" />
      <net name="GND" />
      <trace from=".R1 > .pin1" to="net.VCC" />
      <trace from=".R2 > .pin1" to="net.VCC" />
      <trace from=".R1 > .pin2" to="net.GND" />
      <trace from=".C1 > .pin1" to="net.VCC" />
      <trace from=".C1 > .pin2" to="net.GND" />
    </board>,
  )

  circuit.render()

  // Create a table showing the connectivity mapping
  const connectivityTable: string[] = []

  // Get all elements and their connectivity map keys
  const sourceTraces = circuit.db.source_trace.list()
  const sourcePorts = circuit.db.source_port.list()
  const sourceNets = circuit.db.source_net.list()

  // Collect all table rows first to determine column widths
  const tableRows: Array<[string, string, string, string]> = []

  // Add traces to rows
  for (const trace of sourceTraces.sort((a, b) =>
    a.source_trace_id.localeCompare(b.source_trace_id),
  )) {
    const connectivityKey = trace.subcircuit_connectivity_map_key || "undefined"
    tableRows.push([trace.source_trace_id, "-", "-", connectivityKey])
  }

  // Add ports to rows
  for (const port of sourcePorts.sort((a, b) =>
    a.source_port_id.localeCompare(b.source_port_id),
  )) {
    const connectivityKey = port.subcircuit_connectivity_map_key || "undefined"
    const component = circuit.db.source_component.get(port.source_component_id!)
    const componentName = component?.name || "unknown"
    const pinName = port.name || "unknown"
    tableRows.push([
      port.source_port_id,
      componentName,
      pinName,
      connectivityKey,
    ])
  }

  // Add nets to rows
  for (const net of sourceNets.sort((a, b) =>
    a.source_net_id.localeCompare(b.source_net_id),
  )) {
    const connectivityKey = net.subcircuit_connectivity_map_key || "undefined"
    tableRows.push([net.source_net_id, "-", net.name, connectivityKey])
  }

  // Calculate column widths
  const headers = [
    "Element ID",
    "Component",
    "Pin/Net Name",
    "Connectivity Map Key",
  ]
  const colWidths = headers.map((header, i) => {
    const maxContentWidth = Math.max(...tableRows.map((row) => row[i].length))
    return Math.max(header.length, maxContentWidth)
  })

  // Helper function to pad strings
  const padRight = (str: string, width: number) => str.padEnd(width)

  // Add header
  connectivityTable.push(
    `| ${headers.map((header, i) => padRight(header, colWidths[i])).join(" | ")} |`,
  )
  connectivityTable.push(
    `|${colWidths.map((width) => "-".repeat(width + 2)).join("|")}|`,
  )

  // Add all rows with proper padding
  for (const row of tableRows) {
    connectivityTable.push(
      `| ${row.map((cell, i) => padRight(cell, colWidths[i])).join(" | ")} |`,
    )
  }

  const tableOutput = connectivityTable.join("\n")

  // Snapshot the connectivity mapping table
  expect(tableOutput).toMatchInlineSnapshot(`
    "| Element ID     | Component | Pin/Net Name | Connectivity Map Key    |
    |----------------|-----------|--------------|-------------------------|
    | source_trace_0 | -         | -            | board_connectivity_net0 |
    | source_trace_1 | -         | -            | board_connectivity_net0 |
    | source_trace_2 | -         | -            | board_connectivity_net1 |
    | source_trace_3 | -         | -            | board_connectivity_net0 |
    | source_trace_4 | -         | -            | board_connectivity_net1 |
    | source_port_0  | R1        | pin1         | board_connectivity_net0 |
    | source_port_1  | R1        | pin2         | board_connectivity_net1 |
    | source_port_2  | R2        | pin1         | board_connectivity_net0 |
    | source_port_3  | R2        | pin2         | undefined               |
    | source_port_4  | C1        | pin1         | board_connectivity_net0 |
    | source_port_5  | C1        | pin2         | board_connectivity_net1 |
    | source_net_0   | -         | VCC          | board_connectivity_net0 |
    | source_net_1   | -         | GND          | board_connectivity_net1 |"
  `)

  // Verify basic expectations
  expect(sourceTraces.length).toBe(5)
  expect(sourcePorts.length).toBe(6)
  expect(sourceNets.length).toBe(2)

  // All traces should have connectivity map keys
  for (const trace of sourceTraces) {
    expect(trace.subcircuit_connectivity_map_key).toBeTruthy()
  }

  // All nets should have connectivity map keys
  for (const net of sourceNets) {
    expect(net.subcircuit_connectivity_map_key).toBeTruthy()
  }

  // Connected ports should have connectivity map keys
  const connectedPorts = sourcePorts.filter((port) =>
    sourceTraces.some((trace) =>
      trace.connected_source_port_ids.includes(port.source_port_id),
    ),
  )

  for (const port of connectedPorts) {
    expect(port.subcircuit_connectivity_map_key).toBeTruthy()
  }
})
