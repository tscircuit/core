import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro31-conn-component-not-detected", async () => {
  const { circuit, logSoup } = getTestFixture()

  const normalThickness = 0.2
  const battThickness = 0.4

  circuit.add(
    <board width="25mm" height="30mm"
    autorouter={{
      serverCacheEnabled: false,
      local: false
    }}
    schTraceAutoLabelEnabled
  >
    <hole diameter="3mm" pcbX={-5} pcbY={-13} />
    <silkscreentext 
      text="SimpleWr Cntr" 
      fontSize="1mm" 
       pcbY={-14} pcbX={5}
    />
    <pinheader
      name="batt"
      pinCount={2}
      gender="male"
      pitch="2mm"
      showSilkscreenPinLabels={true}
      pinLabels={["+", "-"]}
      pcbRotation={90}
      footprint="pinrow2_p2mm"
    />

    <pinheader
      name="conn"
      pinCount={4}
      gender="male"
      pitch="3.5mm"
      showSilkscreenPinLabels={true}
      pinLabels={["+", "-"]}
      pcbRotation={90}
      footprint="pinrow4_p3.5mm"
    />

    <resistor name="R1"
      resistance="10k" 
      footprint="1206"
      pcbRotation={180}
    />

    <net name="GND" />
    
    <trace from=".R1 > .pin2" to=".conn > .pin1" thickness={normalThickness} />
    <trace from="net.GND" to=".conn > .pin2" thickness={normalThickness} />

  
    <trace from="net.GND" to=".conn > .pin4" thickness={normalThickness} />
    
  
  </board>,
  )

  circuit.render()

  // Test that the circuit renders without errors
  // expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  // Additional assertions to verify the fix
  const circuitJson = circuit.getCircuitJson()
  
  // Check that the conn component exists in the circuit
  const sourceComponents = circuitJson.filter((c: any) => c.type === "source_component")
  const connComponent = sourceComponents.find((c: any) => c.name === "conn")
  expect(connComponent).toBeDefined()
  expect((connComponent as any)?.ftype).toBe("simple_pin_header")

  // Check that the traces are properly created
  const traces = circuitJson.filter((c: any) => c.type === "source_trace")
  expect(traces.length).toBeGreaterThan(0)

  // Verify that traces referencing conn are present
  const connTraces = traces.filter((trace: any) => 
    trace.display_name?.includes("conn")
  )
  expect(connTraces.length).toBeGreaterThan(0)
}) 
