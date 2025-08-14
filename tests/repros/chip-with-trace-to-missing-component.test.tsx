import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel, RootCircuit } from "tscircuit"
import type { ChipProps } from "@tscircuit/props"

const soicPinLabels = {
  pin1: ["VIN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["VOUT"],
  pin5: ["GP1"],
  pin6: ["GP2"],
  pin7: ["GP3"],
  pin8: ["GP4"],
} as const

const SOIC = (props: ChipProps<typeof soicPinLabels>) => {
  return (
    <chip
      pinLabels={soicPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C82342"],
      }}
      manufacturerPartNumber="RT9013-33GB"
      {...props}
    />
  )
}

const ExampleCircuit = () => (
  <board routingDisabled>
    
    <resistor resistance="1k" footprint="0402" name="R1" schX={0} schY={-1} connections={{
    // pin1: "net.VCC"
    }} />
    <resistor resistance="1k" footprint="0402" name="R2" schX={0} schY={-2} connections={{ pin1: "R1.pin1" }} />
    <resistor resistance="1k" footprint="0402" name="R3" schX={0} schY={-3} connections={{ pin1: "R1.pin1" }} />
    <resistor resistance="1k" footprint="0402" name="R4" schX={0} schY={-4} connections={{ pin1: "R1.pin1" }} />
  </board>
)

test("chip with trace to missing component", () => {
  const { circuit } = getTestFixture()

  circuit.add(<ExampleCircuit />)

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
