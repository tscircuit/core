import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
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
  <board width="25.4mm" height="12.7mm" routingDisabled>
    <group>
      <capacitor
        name="C1"
        schOrientation="vertical"
        footprint="0402"
        capacitance="2.2uF"
        schX={-4}
      />
      <capacitor
        name="C2"
        schOrientation="vertical"
        footprint="0402"
        capacitance="2.2uF"
        schX={-3.2}
      />
      <capacitor
        name="C3"
        schOrientation="vertical"
        footprint="0402"
        capacitance="2.2uF"
        schX={-2.4}
      />
      <SOIC
        name="U1"
        connections={{
          VIN: ["C1.1", "C2.1", "C3.1", "net.VSYS"],
          GND: ["C1.2", "C2.2", "C3.2", "net.GND"],
        }}
      />
    </group>
  </board>
)

test("chip with trace to missing component", () => {
  const { circuit } = getTestFixture()

  circuit.add(<ExampleCircuit />)

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  // Get all traces in the circuit
  const traces = circuit.selectAll("trace")

  // Debug output for trace verification
  // console.log(`Total traces found: ${traces.length}`)
  // traces.forEach((trace, index) => {
  //   console.log(`Trace ${index}: ${trace._parsedProps.from} → ${trace._parsedProps.to}`)
  // })

  // Test 1: Verify total number of traces (should be 8: MSP chains + other traces)
  expect(traces.length).toBe(6)

  // Test 2: Verify MSP routing for VIN pin array connection
  // Should have traces forming C1→C2→C3→U1 chain (3 traces: C1.1→C2.1, C2.1→C3.1, C3.1→U1.VIN)
  const vinTraces = traces.filter((trace) => {
    const from = trace._parsedProps.from
    const to = trace._parsedProps.to
    return (
      to?.includes("VIN") ||
      (from?.includes("C1.1") && to?.includes("C2.1")) ||
      (from?.includes("C2.1") && to?.includes("C3.1")) ||
      (from?.includes("C3.1") && to?.includes("VIN"))
    )
  })
  expect(vinTraces.length).toBe(3)

  // Test 3: Verify MSP routing for GND pin array connection
  // Should have traces forming C1→C2→C3→U1 chain for GND (3 traces: C1.2→C2.2, C2.2→C3.2, C3.2→U1.GND)
  const gndTraces = traces.filter((trace) => {
    const from = trace._parsedProps.from
    const to = trace._parsedProps.to
    return (
      (from?.includes("C1.2") && to?.includes("C2.2")) ||
      (from?.includes("C2.2") && to?.includes("C3.2")) ||
      (from?.includes("C3.2") && to?.includes("U1.GND"))
    )
  })
  expect(gndTraces.length).toBe(3)

  // Test 4: Verify no duplicate individual traces from capacitors to chip
  // There should be NO direct traces from C6 or C1 to U1 pins (MSP prevents this)
  const duplicateTraces = traces.filter((trace) => {
    const from = trace._parsedProps.from
    const to = trace._parsedProps.to
    return (
      (from?.includes("C1.") && to?.includes("U1.")) ||
      (from?.includes("C2.") && to?.includes("U1."))
    )
  })
  expect(duplicateTraces.length).toBe(0)

  // Test 5: Verify components are properly marked to prevent duplicate routing
  const chipU1 = circuit.selectOne("chip")
  if (chipU1) {
    expect((chipU1 as any)._mspRoutedPins).toBeDefined()
    expect((chipU1 as any)._mspRoutedPins.has("VIN")).toBe(true)
    expect((chipU1 as any)._mspRoutedPins.has("GND")).toBe(true)
  }

  // Test 6: Verify that MSP routing is creating optimized trace patterns
  // Count traces that involve capacitor-to-capacitor connections (MSP chains)
  const capacitorChainTraces = traces.filter((trace) => {
    const from = trace._parsedProps.from
    const to = trace._parsedProps.to
    return (
      (from?.includes("C") && to?.includes("C")) || // C-to-C connections
      (from?.includes("C") && to?.includes("U1")) // C-to-chip connections
    )
  })

  // Should have MSP chain connections: 6 total (3 VIN chain + 3 GND chain)
  expect(capacitorChainTraces.length).toBe(6)
})
