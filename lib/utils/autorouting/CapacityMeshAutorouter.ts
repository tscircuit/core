/**
 * Integration with the @tscircuit/capacity-autorouter package.
 * 
 * This autorouter is a high-density PCB autorouter that uses a capacity-based
 * algorithm to find optimal routes. It can be used both synchronously and
 * asynchronously, with an explicit step function that allows for progressive
 * routing.
 * 
 * Usage:
 * 
 * 1. Synchronous:
 *    ```
 *    const autorouter = new CapacityMeshAutorouter({ input: simpleRouteJson });
 *    const traces = autorouter.solveAndMapToTraces();
 *    ```
 * 
 * 2. Asynchronous with explicit steps:
 *    ```
 *    const autorouter = new CapacityMeshAutorouter({ input: simpleRouteJson });
 *    while (!autorouter.solved && !autorouter.failed) {
 *      autorouter.step();
 *    }
 *    const traces = autorouter.solveAndMapToTraces();
 *    ```
 * 
 * 3. Asynchronous with Promise:
 *    ```
 *    const autorouter = new CapacityMeshAutorouter({ input: simpleRouteJson });
 *    await autorouter.solve();
 *    const traces = autorouter.solveAndMapToTraces();
 *    ```
 */
import { CapacityMeshSolver } from "@tscircuit/capacity-autorouter"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

export class CapacityMeshAutorouter {
  input: SimpleRouteJson
  solver: CapacityMeshSolver
  solved: boolean = false
  failed: boolean = false
  
  constructor({ input }: { input: SimpleRouteJson }) {
    this.input = input
    
    // Make sure we have valid data for the autorouter
    if (!input.connections || input.connections.length === 0) {
      console.warn("No connections provided to CapacityMeshAutorouter")
    }
    
    this.solver = new CapacityMeshSolver(input)
  }

  /**
   * Steps the solver forward, returns true if routing completed successfully
   * or false if more steps are required or routing failed
   */
  step(): boolean {
    if (this.solved || this.failed) return this.solved

    try {
      this.solver.step()
      this.solved = this.solver.solved
      this.failed = this.solver.failed
      return this.solved
    } catch (e) {
      this.failed = true
      console.error("Capacity mesh autorouter error:", e)
      return false
    }
  }

  /**
   * Runs all steps until completion or failure
   */
  async solve(): Promise<boolean> {
    // Use setTimeout to ensure we don't block the main thread
    return new Promise((resolve) => {
      const runStep = () => {
        if (this.step()) {
          resolve(true)
        } else if (this.failed) {
          resolve(false)
        } else {
          setTimeout(runStep, 0)
        }
      }
      
      runStep()
    })
  }

  /**
   * Returns the solution traces after solving
   */
  solveAndMapToTraces(): SimplifiedPcbTrace[] {
    if (!this.solved && !this.failed) {
      let stepCount = 0
      const maxSteps = 1000
      while (!this.solver.solved && !this.solver.failed && stepCount < maxSteps) {
        this.solver.step()
        stepCount++
      }
      
      this.solved = this.solver.solved
      this.failed = this.solver.failed
    }

    if (this.failed) {
      return []
    }

    // Get the result from the solver
    const result = this.solver.getOutputSimpleRouteJson()
    
    // If the solver didn't return any traces but indicates success,
    // generate simple direct paths as a fallback
    if ((!result.traces || result.traces.length === 0) && this.solved) {
      const directTraces: SimplifiedPcbTrace[] = this.input.connections.map((conn, index) => {
        if (conn.pointsToConnect.length < 2) return null
        
        // Create a direct trace from first to last point
        const points = conn.pointsToConnect
        const route = points.map((point, i) => ({
          route_type: "wire" as const,
          x: point.x,
          y: point.y,
          width: this.input.minTraceWidth,
          layer: point.layer || "top"
        }))
        
        return {
          type: "pcb_trace",
          pcb_trace_id: `trace-${index}`,
          route
        }
      }).filter(Boolean) as SimplifiedPcbTrace[]
      
      return directTraces
    }
    
    return result.traces || []
  }

  /**
   * Gets the visualization data for debugging
   */
  visualize() {
    return this.solver.visualize()
  }
}