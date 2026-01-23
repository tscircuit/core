// @ts-ignore
import { RootCircuit } from "../../dist"
import React from "react"

const circuit = new RootCircuit()

circuit.add(
  <board width="50mm" height="50mm" schAutoLayoutEnabled>
    <resistor name="R1" resistance="1k" footprint="0603" />
    <resistor name="R2" resistance="1k" footprint="0603" />

    <constraint xDist="20mm" left=".R1" right=".R2" centerToCenter />

    <net name="GND" />
  </board>,
)
console.log("Rendering circuit from dist (xdist constraint)...")
circuit.render()

console.log("Validating circuit JSON...")
const circuitJson = circuit.getCircuitJson()

let checksPassed = true
const errors: string[] = []

if (!Array.isArray(circuitJson) || circuitJson.length === 0) {
  checksPassed = false
  errors.push("Error: circuitJson is not a non-empty array.")
} else {
  const hasPcbComponent = circuitJson.some((el) => el.type === "pcb_component")
  if (!hasPcbComponent) {
    checksPassed = false
    errors.push("Error: circuitJson does not contain any pcb_component.")
  }

  const sourceComponents = circuitJson.filter(
    (el) => el.type === "source_component",
  ) as any[]
  const hasR1 = sourceComponents.some((el) => el.name === "R1")
  const hasR2 = sourceComponents.some((el) => el.name === "R2")

  if (!hasR1) {
    checksPassed = false
    errors.push("Error: Source component 'R1' not found.")
  }
  if (!hasR2) {
    checksPassed = false
    errors.push("Error: Source component 'R2' not found.")
  }
}

if (checksPassed) {
  console.log(
    "\nSmoke test passed: xDist constraint basic validation successful!",
  )
  process.exit(0)
}

console.error("\nSmoke test FAILED:")
errors.forEach((err) => console.error(err))
process.exit(1)
