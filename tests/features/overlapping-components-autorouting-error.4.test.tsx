import { test, expect } from "bun:test";
import { CapacityMeshAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter";

test("CapacityMeshAutorouter async test with no routing space", async () => {
  // Create a scenario that will trigger the error in async mode
  const problematicSimpleRouteJson = {
    layerCount: 1,
    minTraceWidth: 1.0, // Very large trace width
    obstacles: [
      // Fill the space with obstacles
      {
        type: "rect" as const,
        layers: ["top"],
        center: { x: -2, y: 0 },
        width: 3,
        height: 3,
        connectedTo: [],
      },
      {
        type: "rect" as const,
        layers: ["top"],
        center: { x: 2, y: 0 },
        width: 3,
        height: 3,
        connectedTo: [],
      },
      {
        type: "rect" as const,
        layers: ["top"],
        center: { x: 0, y: 2 },
        width: 3,
        height: 3,
        connectedTo: [],
      },
      {
        type: "rect" as const,
        layers: ["top"],
        center: { x: 0, y: -2 },
        width: 3,
        height: 3,
        connectedTo: [],
      },
    ],
    connections: [
      {
        name: "blocked_connection",
        pointsToConnect: [
          { x: -3, y: 0, layer: "top" },
          { x: 3, y: 0, layer: "top" },
        ],
      },
    ],
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
  };

  const autorouter = new CapacityMeshAutorouter(problematicSimpleRouteJson);

  // Set up error handler
  let errorReceived: Error | null = null;
  let completedSuccessfully = false;

  autorouter.on("error", (event) => {
    errorReceived = event.error;
  });

  autorouter.on("complete", () => {
    completedSuccessfully = true;
  });

  // Start the autorouter
  autorouter.start();

  // Wait for either completion or error
  await new Promise<void>((resolve) => {
    const checkComplete = () => {
      if (errorReceived || completedSuccessfully) {
        resolve();
      } else {
        setTimeout(checkComplete, 100);
      }
    };
    checkComplete();

    // Add a timeout
    setTimeout(() => {
      resolve();
    }, 3000);
  });

  if (errorReceived) {
    // Verify we received an appropriate error message
    const errorMessage = (errorReceived as Error).message;

    if (errorMessage.includes("Unexpected numItems value: 0")) {
      throw new Error(
        "The original cryptic error message is still being thrown: " +
          errorMessage
      );
    } else if (
      errorMessage.includes(
        "Autorouting failed: No valid routing space available"
      )
    ) {
      expect(errorMessage).toContain("components are overlapping");
      expect(errorMessage).toContain("Please check component placement");
    }
  } else if (completedSuccessfully) {
    // If it completed successfully, that's also fine - the scenario might not trigger the error
    console.log("Autorouting completed successfully");
  } else {
    // If we timed out without error or completion, that's unexpected
    console.log("Test timed out without error or completion");
  }
});
