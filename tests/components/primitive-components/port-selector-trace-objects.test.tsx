import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { Chip } from "lib/components/normal-components/Chip"
import { Group } from "lib/components/primitive-components/Group/Group"
import { Port } from "lib/components/primitive-components/Port"
import { SymbolComponent } from "lib/components/primitive-components/Symbol/Symbol"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Port objects connect custom-symbol ports within their own subcircuits", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const board = new Board({ width: 34, height: 12 })
  circuit.add(board)
  const connections: { group: Group; source: Port; target: Port }[] = []
  const footprint = (
    <footprint>
      <smtpad portHints={["1"]} width={1} height={1} shape="rect" />
    </footprint>
  )

  for (const { name, portName, pcbX } of [
    { name: "left", portName: "ground.1", pcbX: -8 },
    { name: "right", portName: "USB+", pcbX: 8 },
  ]) {
    const group = new Group({ name, pcbX, subcircuit: true })
    const chip = new Chip({ name: "U1", pcbX: -3, footprint })
    const symbol = new SymbolComponent({})
    const source = new Port({
      name: portName,
      pinNumber: 1,
      direction: "right",
    })
    symbol.add(source)
    chip.add(symbol)
    const targetChip = new Chip({ name: "U2", pcbX: 3, footprint })
    const target = new Port({ name: "SIG", pinNumber: 1 })
    targetChip.add(target)
    group.add(chip)
    group.add(targetChip)
    group.add(
      new Trace(
        name === "left"
          ? { from: source, to: target }
          : { path: [source, target] },
      ),
    )
    group.add(
      <pcbnotetext text={`${name}: ${portName}`} pcbY={3} fontSize={0.6} />,
    )
    group.add(
      <pcbnotetext
        text="Port objects connect U1 to U2"
        pcbY={-3}
        fontSize={0.45}
      />,
    )
    board.add(group)
    connections.push({ group, source, target })
  }
  await circuit.renderUntilSettled()

  for (const { group, source, target } of connections) {
    const selectedSources = group.selectAll(source.getPortSelector())
    const selectedTargets = group.selectAll(target.getPortSelector())
    expect(selectedSources).toHaveLength(1)
    expect(selectedSources[0]).toBe(source)
    expect(selectedTargets).toHaveLength(1)
    expect(selectedTargets[0]).toBe(target)
    const trace = circuit.db.source_trace
      .list()
      .find((trace) =>
        trace.connected_source_port_ids.includes(source.source_port_id!),
      )
    expect(trace?.connected_source_port_ids).toEqual([
      source.source_port_id!,
      target.source_port_id!,
    ])
  }
  expect(circuit.db.source_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
