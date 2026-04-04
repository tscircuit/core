import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro100: inflated footprint aliases remain valid routing targets after inflation", async () => {
  const circuitJson = [
    {
      type: "source_component",
      source_component_id: "source_component_0",
      ftype: "simple_chip",
      name: "U1",
    },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_0",
      source_component_id: "source_component_0",
      center: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 2, height: 2 },
      port_labels: { pin1: "SIG" },
    },
    {
      type: "source_port",
      source_port_id: "source_port_0",
      source_component_id: "source_component_0",
      name: "SIG",
      pin_number: 1,
      port_hints: ["pin1", "A1", "SIG", "1"],
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 0, y: 0 },
      width: 2,
      height: 2,
      rotation: 0,
      layer: "top",
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_0",
      source_port_id: "source_port_0",
      pcb_component_id: "pcb_component_0",
      x: 0,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_0",
      pcb_component_id: "pcb_component_0",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      layer: "top",
      shape: "rect",
      port_hints: ["pin1", "A1", "SIG"],
    },
  ] as AnyCircuitElement[]

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" circuitJson={circuitJson} pcbX={-4} pcbY={0} />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".S1 > .U1 > .A1" to=".R1 > .pin1" pcbStraightLine />
    </board>,
  )

  await circuit.renderUntilSettled()

  const importedPort = circuit.selectOne(".S1 > .U1 > .A1")
  expect(importedPort).toBeTruthy()
  if (importedPort) expect(importedPort.getNameAndAliases()).toContain("A1")

  const errors = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "source_trace_not_connected_error")
  expect(errors).toHaveLength(0)

  const sourceTrace = circuit.db.source_trace.list()[0]
  expect(sourceTrace).toBeDefined()

  for (const sourcePortId of sourceTrace.connected_source_port_ids) {
    expect(
      circuit.db.pcb_port.getWhere({ source_port_id: sourcePortId }),
    ).toBeDefined()
  }
})
