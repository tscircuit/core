// @ts-nocheck
import { RootCircuit } from "./lib/RootCircuit"
import "./lib/register-catalogue"
import React from "react"

const circuit = new RootCircuit()

// Add a panel
circuit.add(
  <panel width="50mm" height="20mm">
    <board width="20mm" height="15mm">
      <resistor resistance="1k" footprint="0402" name="R1" />
    </board>
  </panel>
)

await circuit.renderUntilSettled()
const circuitJson = circuit.getCircuitJson()

// Find the metadata
const metadata = circuitJson.find(e => e.type === "source_project_metadata")

console.log("\n--- TEST RESULTS ---")
if (metadata?.schematic_disabled === true) {
  console.log("✅ SUCCESS: 'schematic_disabled: true' found in metadata.")
} else {
  console.log("❌ FAILED: 'schematic_disabled' not found or incorrect.")
}

const schematicElements = circuitJson.filter(e => e.type.startsWith("schematic_"))
if (schematicElements.length === 0) {
  console.log("✅ SUCCESS: No schematic elements were generated.")
} else {
  console.log("❌ FAILED: Found " + schematicElements.length + " schematic elements.")
}
console.log("-------------------\n")
