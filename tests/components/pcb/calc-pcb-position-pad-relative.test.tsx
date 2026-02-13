import { expect, test } from "bun:test"
import { getBoundsOfPcbElements } from "@tscircuit/circuit-json-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc supports pad-relative references", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor name="R1" footprint="0402" resistance="1k" pcbX="0mm" />
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        pcbX="calc(R1.pin1.minX - 2mm)"
        pcbY="calc(R1.pin1.y)"
      />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(0)

  const sourceComponents = circuit.db.source_component.list()
  const r1Source = sourceComponents.find((component) => component.name === "R1")
  const r2Source = sourceComponents.find((component) => component.name === "R2")

  const pcbComponents = circuit.db.pcb_component.list()
  const r1 = pcbComponents.find(
    (component) =>
      component.source_component_id === r1Source?.source_component_id,
  )
  const r2 = pcbComponents.find(
    (component) =>
      component.source_component_id === r2Source?.source_component_id,
  )

  const r1SourcePort1 = circuit.db.source_port
    .list({ source_component_id: r1Source?.source_component_id })
    .find(
      (sourcePort) => sourcePort.name === "pin1" || sourcePort.pin_number === 1,
    )

  const r1PcbPort1 = r1SourcePort1
    ? circuit.db.pcb_port.getWhere({
        source_port_id: r1SourcePort1.source_port_id,
      })
    : null

  const r1Pad1 =
    (r1PcbPort1
      ? circuit.db.pcb_smtpad.getWhere({ pcb_port_id: r1PcbPort1.pcb_port_id })
      : null) ??
    (r1PcbPort1
      ? circuit.db.pcb_plated_hole.getWhere({
          pcb_port_id: r1PcbPort1.pcb_port_id,
        })
      : null)

  expect(r1).toBeDefined()
  expect(r2).toBeDefined()
  expect(r1Pad1).toBeDefined()

  const bounds = getBoundsOfPcbElements([r1Pad1!])
  const r1Pad1CenterY = (bounds.minY + bounds.maxY) / 2

  expect(r2?.center.x).toBeCloseTo(bounds.minX - 2)
  expect(r2?.center.y).toBeCloseTo(r1Pad1CenterY)
})
