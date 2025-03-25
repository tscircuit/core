import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Test for the Design Rule Check (DRC) phase
 * 
 * This test creates a simple circuit with intentionally crossing traces
 * to trigger DRC errors. It verifies that the DRC phase correctly identifies
 * and reports trace overlaps as errors.
 */
test("design rule check detects crossing traces", async () => {
  const { circuit } = getTestFixture()
  
  // Create a circuit with traces that will cross each other on the same layer
  // Arrange components in a cross pattern and force traces to stay on the same layer
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter="sequential-trace"
    >
      {/* Create four resistors in a cross pattern */}
      <resistor name="R1" footprint="0402" resistance="10k" pcbX={-3} pcbY={0} />
      <resistor name="R2" footprint="0402" resistance="10k" pcbX={3} pcbY={0} />
      <resistor name="R3" footprint="0402" resistance="10k" pcbX={0} pcbY={-3} />
      <resistor name="R4" footprint="0402" resistance="10k" pcbX={0} pcbY={3} />
      
      {/* Force traces to be created on the same layer (F.Cu) to cause crossing errors */}
      <trace from=".R1 > .pin1" to=".R2 > .pin2" layer="F.Cu" />
      <trace from=".R3 > .pin1" to=".R4 > .pin2" layer="F.Cu" />
    </board>,
  )

  // Ensure the circuit is fully rendered including the DRC phase
  await circuit.renderUntilSettled()

  // Check for DRC errors in the database
  // The PR introduces pcb_trace_error table to store DRC errors
  let traceErrors = []
  
  if (circuit.db.pcb_trace_error) {
    if (typeof circuit.db.pcb_trace_error.list === 'function') {
      traceErrors = circuit.db.pcb_trace_error.list()
    } else if (typeof circuit.db.pcb_trace_error.toArray === 'function') {
      traceErrors = circuit.db.pcb_trace_error.toArray()
    } else if (Array.isArray(circuit.db.pcb_trace_error)) {
      traceErrors = circuit.db.pcb_trace_error
    }
    
    // Verify we have DRC errors
    expect(traceErrors.length).toBeGreaterThan(0)
    
    // Look for trace overlap errors (which should be found by DRC)
    const overlapErrors = traceErrors.filter(e => 
      e.pcb_trace_error_id?.includes('overlap') || 
      e.message?.includes('overlaps with')
    )
    
    // Expect to find at least one overlap error
    expect(overlapErrors.length).toBeGreaterThan(0)
    
    // Verify the error message mentions trace overlaps
    expect(traceErrors.some(e => 
      e.message?.includes('overlaps with') && 
      (e.message?.includes('trace') || e.message?.includes('PCB trace'))
    )).toBe(true)
  } else {
    // This would fail the test if DRC isn't implemented
    expect(circuit.db.pcb_trace_error).toBeDefined()
  }
  
  // Save the rendered PCB with errors as a snapshot
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})