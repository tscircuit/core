import type { ManualEditEvent } from "@tscircuit/props"
import { su } from "@tscircuit/soup-util"
import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { applyEditEvents } from "lib/utils/edit-events/apply-edit-events-to-circuit-json"

test("applyEditEvents can modify PCB component location", async () => {
  // Create a circuit with a resistor
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" />
    </board>
  )
  await circuit.render()

  const circuitJson = circuit.getCircuitJson()
  
  // Get original PCB component
  const originalPcbComponent = su(circuitJson).pcb_component.get(
    circuit.db.pcb_component.list()[0].pcb_component_id
  )
  
  // Create edit event to move the PCB component
  const editEvents: ManualEditEvent[] = [
    {
      edit_event_type: "edit_pcb_component_location",
      edit_event_id: "test_event_1",
      created_at: Date.now(),
      pcb_component_id: circuit.db.pcb_component.list()[0].pcb_component_id,
      original_center: originalPcbComponent?.center || { x: 0, y: 0 },
      new_center: { x: 5, y: 3 },
      pcb_edit_event_type: "edit_component_location",
    }
  ]

  // Apply the edit events
  const updatedCircuitJson = applyEditEvents({
    circuitJson,
    editEvents
  })

  // Verify the PCB component was moved
  const updatedPcbComponent = su(updatedCircuitJson).pcb_component.get(
    circuit.db.pcb_component.list()[0].pcb_component_id
  )
  
  expect(updatedPcbComponent?.center).toEqual({ x: 5, y: 3 })
})

test("applyEditEvents can modify schematic component location", async () => {
  // Create a circuit with a resistor
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" />
    </board>
  )
  await circuit.render()

  const circuitJson = circuit.getCircuitJson()
  
  // Get original schematic component
  const originalSchematicComponent = su(circuitJson).schematic_component.get(
    circuit.db.schematic_component.list()[0].schematic_component_id
  )
  
  // Create edit event to move the schematic component
  const editEvents: ManualEditEvent[] = [
    {
      edit_event_type: "edit_schematic_component_location",
      edit_event_id: "test_event_1",
      created_at: Date.now(),
      schematic_component_id: circuit.db.schematic_component.list()[0].schematic_component_id,
      original_center: originalSchematicComponent?.center || { x: 0, y: 0 },
      new_center: { x: 8, y: 4 }
    }
  ]

  // Apply the edit events
  const updatedCircuitJson = applyEditEvents({
    circuitJson,
    editEvents
  })

  // Verify the schematic component was moved
  const updatedSchematicComponent = su(updatedCircuitJson).schematic_component.get(
    circuit.db.schematic_component.list()[0].schematic_component_id
  )
  
  expect(updatedSchematicComponent?.center).toEqual({ x: 8, y: 4 })
})

test("applyEditEvents applies multiple edit events in sequence", async () => {
  // Create a circuit with a resistor
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" />
    </board>
  )
  await circuit.render()

  const circuitJson = circuit.getCircuitJson()
  
  // Get component IDs
  const pcbComponentId = circuit.db.pcb_component.list()[0].pcb_component_id
  const schematicComponentId = circuit.db.schematic_component.list()[0].schematic_component_id
  
  // Create multiple edit events
  const editEvents: ManualEditEvent[] = [
    {
      edit_event_type: "edit_pcb_component_location",
      edit_event_id: "test_event_1",
      created_at: Date.now(),
      pcb_component_id: pcbComponentId,
      original_center: { x: 0, y: 0 },
      new_center: { x: 5, y: 3 },
      pcb_edit_event_type: "edit_component_location",
    },
    {
      edit_event_type: "edit_schematic_component_location",
      edit_event_id: "test_event_2",
      created_at: Date.now(),
      schematic_component_id: schematicComponentId,
      original_center: { x: 0, y: 0 },
      new_center: { x: 8, y: 4 }
    }
  ]

  // Apply the edit events
  const updatedCircuitJson = applyEditEvents({
    circuitJson,
    editEvents
  })

  // Verify both components were moved
  const updatedPcbComponent = su(updatedCircuitJson).pcb_component.get(pcbComponentId)
  const updatedSchematicComponent = su(updatedCircuitJson).schematic_component.get(schematicComponentId)
  
  expect(updatedPcbComponent?.center).toEqual({ x: 5, y: 3 })
  expect(updatedSchematicComponent?.center).toEqual({ x: 8, y: 4 })
})
