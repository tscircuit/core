import React from "react"
import { describe, expect, test } from "bun:test"
import { Circuit } from "../lib/RootCircuit"
import { CapacityMeshAutorouter } from "../lib/utils/autorouting/CapacityMeshAutorouter"

describe("Capacity Autorouter Integration", () => {
  test("should create a CapacityMeshAutorouter instance and run steps", () => {
    // Create a simple SimpleRouteJson input
    const input = {
      layerCount: 2,
      minTraceWidth: 0.2,
      obstacles: [],
      connections: [
        {
          name: "test-connection",
          pointsToConnect: [
            { x: 1, y: 1, layer: "top" },
            { x: 10, y: 10, layer: "top" }
          ]
        }
      ],
      bounds: { minX: 0, maxX: 20, minY: 0, maxY: 20 }
    };
    
    // Create autorouter instance
    const autorouter = new CapacityMeshAutorouter({ input });
    
    // Run a few steps
    for (let i = 0; i < 10; i++) {
      autorouter.step();
    }
    
    // Verify we can get traces
    const traces = autorouter.solveAndMapToTraces();
    expect(traces.length).toBeGreaterThan(0);
  });
  
  test("should run to completion with solve method", async () => {
    // Create a simple SimpleRouteJson input
    const input = {
      layerCount: 2,
      minTraceWidth: 0.2,
      obstacles: [],
      connections: [
        {
          name: "test-connection",
          pointsToConnect: [
            { x: 5, y: 5, layer: "top" },
            { x: 15, y: 15, layer: "top" }
          ]
        }
      ],
      bounds: { minX: 0, maxX: 20, minY: 0, maxY: 20 }
    };
    
    // Create autorouter instance
    const autorouter = new CapacityMeshAutorouter({ input });
    
    // Solve completely
    const success = await autorouter.solve();
    
    // Verify results
    expect(success).toBe(true);
    expect(autorouter.solved).toBe(true);
    
    const traces = autorouter.solveAndMapToTraces();
    expect(traces.length).toBeGreaterThan(0);
  });
})