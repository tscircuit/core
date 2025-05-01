import {
  RootCircuit,
  board,
  capacitor,
  resistor,
  chip,
  net,
  trace,
} from "../../dist"
import React from "react"

const circuit = new RootCircuit()

circuit.add(
  <board width="20mm" height="20mm" schAutoLayoutEnabled>
    <capacitor
      name="C1"
      capacitance="10uF"
      footprint="0805"
      pcbX={0}
      pcbY={5}
    />
    <resistor name="R1" resistance="10k" footprint="0603" pcbX={5} pcbY={0} />
    <chip
      name="SW1"
      footprint="pushbutton"
      pcbX={-5}
      pcbY={0}
      schPinArrangement={{
        leftSize: 2,
        rightSize: 2,
        topSize: 0,
        bottomSize: 0,
      }}
    />
    <net name="VCC" />
    <net name="GND" />

    <trace from=".SW1 > .pin1" to=".C1 > .pin1" />
    <trace from=".C1 > .pin2" to="net.GND" />
    <trace from=".SW1 > .pin2" to=".R1 > .pin1" />
    <trace from=".R1 > .pin2" to=".SW1 > .pin1" />
    <trace from=".SW1 > .pin2" to="net.GND" />
  </board>,
)

console.log("Rendering circuit from dist...")
circuit.render()

console.log("Validating circuit JSON...")
const circuitJson = circuit.getCircuitJson()

let checksPassed = true
const errors: string[] = []

if (!Array.isArray(circuitJson) || circuitJson.length === 0) {
  checksPassed = false
  errors.push("Error: circuitJson is not a non-empty array.")
} else {
  const hasSourceComponent = circuitJson.some(
    (el) => el.type === "source_component",
  )
  const hasSchematicComponent = circuitJson.some(
    (el) => el.type === "schematic_component",
  )
  const hasPcbComponent = circuitJson.some((el) => el.type === "pcb_component")

  if (!hasSourceComponent) {
    checksPassed = false
    errors.push("Error: circuitJson does not contain any source_component.")
  }
  if (!hasSchematicComponent) {
    checksPassed = false
    errors.push("Error: circuitJson does not contain any schematic_component.")
  }
  if (!hasPcbComponent) {
    checksPassed = false
    errors.push("Error: circuitJson does not contain any pcb_component.")
  }

  const sourceComponents = circuitJson.filter(
    (el) => el.type === "source_component",
  ) as any[]
  const hasC1 = sourceComponents.some((el) => el.name === "C1")
  const hasR1 = sourceComponents.some((el) => el.name === "R1")
  const hasSW1 = sourceComponents.some((el) => el.name === "SW1")

  if (!hasC1) {
    checksPassed = false
    errors.push("Error: Source component 'C1' not found.")
  }
  if (!hasR1) {
    checksPassed = false
    errors.push("Error: Source component 'R1' not found.")
  }
  if (!hasSW1) {
    checksPassed = false
    errors.push("Error: Source component 'SW1' not found.")
  }
}

if (checksPassed) {
  console.log("\nSmoke test passed: Basic circuit JSON validation successful!")
  process.exit(0)
} else {
  console.error("\nSmoke test FAILED:")
  errors.forEach((err) => console.error(err))
  process.exit(1)
}
