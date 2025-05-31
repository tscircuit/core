import { test, expect } from "bun:test";
import { CapacityMeshAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter";

test("CapacityMeshAutorouter with completely blocked routing space", () => {
  // Create a scenario with a massive obstacle blocking all routing
  const problematicSimpleRouteJson = {
    layerCount: 1,
    minTraceWidth: 0.1,
    obstacles: [
      // Create a massive obstacle that covers the entire routing area
      {
        type: "rect" as const,
        layers: ["top"],
        center: { x: 0, y: 0 },
        width: 20,
        height: 20,
        connectedTo: [],
      },
    ],
    connections: [
      {
        name: "impossible_connection",
        pointsToConnect: [
          { x: -5, y: 0, layer: "top" },
          { x: 5, y: 0, layer: "top" },
        ],
      },
    ],
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
  };

  const autorouter = new CapacityMeshAutorouter(problematicSimpleRouteJson);

  try {
    const result = autorouter.solveSync();

    // If somehow it succeeded, verify the result at least
    expect(result).toBeDefined();
  } catch (error) {
    // If it throws an error, verify it's our enhanced error message
    expect(error).toBeInstanceOf(Error);
    const errorMessage = (error as Error).message;

    if (errorMessage.includes("Unexpected numItems value: 0")) {
      // This means our enhancement didn't catch it - this is what we're trying to fix
      throw new Error(
        "The original cryptic error message is still being thrown: " +
          errorMessage
      );
    } else if (
      errorMessage.includes(
        "Autorouting failed: No valid routing space available"
      )
    ) {
      // This is good - our enhanced error message is working
      expect(errorMessage).toContain("components are overlapping");
      expect(errorMessage).toContain("Please check component placement");
    } else {
      // Some other error - let it through for debugging
      throw error;
    }
  }
});
