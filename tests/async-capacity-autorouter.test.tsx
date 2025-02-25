import React from "react"
import { describe, expect, test } from "bun:test"
import { Circuit } from "../lib/RootCircuit"
import { CapacityMeshAutorouter } from "../lib/utils/autorouting"
import { getSimpleRouteJsonFromCircuitJson } from "../lib/utils/autorouting"

describe("Async Capacity Autorouter", () => {
  test("should route asynchronously with the step function", async () => {
    // Create a circuit
    const circuit = new Circuit()
    
    circuit.add(
      <board width="40mm" height="40mm">
        <resistor name="R1" resistance="10k" footprint="0402" x="5mm" y="5mm" />
        <resistor name="R2" resistance="10k" footprint="0402" x="5mm" y="15mm" />
        <resistor name="R3" resistance="10k" footprint="0402" x="5mm" y="25mm" />
        <led name="L1" footprint="0402" x="35mm" y="5mm" />
        <led name="L2" footprint="0402" x="35mm" y="15mm" />
        <led name="L3" footprint="0402" x="35mm" y="25mm" />
        
        <trace from=".R1 > .pin1" to=".L1 > .pin1" />
        <trace from=".R2 > .pin1" to=".L2 > .pin1" />
        <trace from=".R3 > .pin1" to=".L3 > .pin1" />
      </board>
    )
    
    // Generate initial circuit JSON for the input to the autorouter
    const circuitJson = circuit.getCircuitJson()
    
    // Get the SimpleRouteJson representation for the autorouter
    const simpleRouteJson = getSimpleRouteJsonFromCircuitJson({ 
      circuitJson,
      minTraceWidth: 0.2
    })
    
    // Create the capacity autorouter
    const autorouter = new CapacityMeshAutorouter({
      input: simpleRouteJson,
    })
    
    // Demonstrate stepping through the routing process
    let stepCount = 0
    const maxSteps = 1000 // Safety limit
    
    while (!autorouter.solved && !autorouter.failed && stepCount < maxSteps) {
      autorouter.step()
      stepCount++
    }
    
    console.log(`Routing completed in ${stepCount} steps`)
    
    // Verify the results
    expect(autorouter.solved).toBe(true)
    expect(autorouter.failed).toBe(false)
    
    const result = autorouter.solveAndMapToTraces()
    expect(result.length).toBeGreaterThan(0)
  })
  
  test("should support async/await pattern with solve method", async () => {
    // Create a circuit
    const circuit = new Circuit()
    
    circuit.add(
      <board width="40mm" height="40mm">
        <resistor name="R1" resistance="10k" footprint="0402" x="5mm" y="5mm" />
        <led name="L1" footprint="0402" x="35mm" y="35mm" />
        <trace from=".R1 > .pin1" to=".L1 > .pin1" />
      </board>
    )
    
    // Generate the circuit JSON for input
    const circuitJson = circuit.getCircuitJson()
    
    // Get the SimpleRouteJson representation
    const simpleRouteJson = getSimpleRouteJsonFromCircuitJson({ 
      circuitJson,
      minTraceWidth: 0.2
    })
    
    // Create the capacity autorouter
    const autorouter = new CapacityMeshAutorouter({
      input: simpleRouteJson,
    })
    
    // Solve asynchronously
    const success = await autorouter.solve()
    
    // Verify the results
    expect(success).toBe(true)
    expect(autorouter.solved).toBe(true)
    expect(autorouter.failed).toBe(false)
    
    const result = autorouter.solveAndMapToTraces()
    expect(result.length).toBeGreaterThan(0)
  })
})