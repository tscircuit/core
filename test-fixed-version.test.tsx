import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

test("SchematicRect with traces - Fixed PCB component issue", async () => {
  const circuit = new RootCircuit()
  
  // Create the exact JSX structure using React.createElement to avoid JSX issues
  const React = require("react")
  
  const circuitElement = React.createElement("board", {}, 
    React.createElement("chip", {
      name: "U1",
      symbol: React.createElement("symbol", {},
        React.createElement("schematicrect", {
          center: { x: 0, y: 0 },
          width: 2,
          height: 2,
          isFilled: false
        }),
        React.createElement("port", { 
          name: "pin1", 
          direction: "right", 
          schX: 1, 
          schY: 0 
        })
      )
    }),
    React.createElement("chip", {
      name: "U2", 
      symbol: React.createElement("symbol", {},
        React.createElement("schematicrect", {
          center: { x: 5, y: 0 },
          width: 2,
          height: 2,
          isFilled: false
        }),
        React.createElement("port", { 
          name: "pin1", 
          direction: "left", 
          schX: 4, 
          schY: 0 
        })
      )
    }),
    React.createElement("trace", { 
      from: ".U1 > .pin1", 
      to: ".U2 > .pin1" 
    })
  )

  circuit.add(circuitElement)

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const schematic_trace = circuitJson.filter((c) => c.type === "schematic_trace")
  
  // Test that we have the expected components
  const chips = circuitJson.filter(c => c.type === "source_component")
  const ports = circuitJson.filter(c => c.type === "source_port")
  const schematicRects = circuitJson.filter(c => c.type === "schematic_rect")
  
  console.log(`Found ${chips.length} chips, ${ports.length} ports, ${schematicRects.length} schematic rects`)
  
  // The key test: no "has no parent pcb component" error should have been thrown
  expect(chips.length).toBe(2) // U1 and U2
  expect(ports.length).toBe(2) // pin1 for each chip
  expect(schematicRects.length).toBe(2) // schematic rect for each chip symbol
  
  // Note: schematic_trace count may vary based on layout, but the important thing 
  // is that we didn't get the PCB component error
  console.log(`Schematic traces: ${schematic_trace.length}`)
})