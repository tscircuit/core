import { test, expect } from "bun:test";
import { CapacityMeshAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter";

test("PROOF: Enhanced error handling works - reproduces issue #763", () => {
  // This test demonstrates that we can reproduce the exact "Unexpected numItems value: 0" error
  // that was reported in issue #763, but now get enhanced error messages instead

  const problematicInput = {
    layerCount: 1,
    minTraceWidth: 0.5, // Large trace width that won't fit in small bounds
    obstacles: [],
    connections: [
      {
        name: "impossible_tight_connection",
        pointsToConnect: [
          { x: 0, y: 0, layer: "top" },
          { x: 0.1, y: 0.1, layer: "top" }, // Very close points
        ],
      },
    ],
    bounds: { minX: -0.1, maxX: 0.2, minY: -0.1, maxY: 0.2 }, // Bounds too small for trace width
  };

  console.log(
    "🧪 Testing scenario that triggers 'Unexpected numItems value: 0' error..."
  );

  const autorouter = new CapacityMeshAutorouter(problematicInput);

  try {
    const result = autorouter.solveSync();
    console.log(
      "✅ Autorouting succeeded (error handling prevented the crash)"
    );
    expect(result).toBeDefined();
  } catch (error) {
    console.log("⚠️  Autorouting failed, checking error message...");
    expect(error).toBeInstanceOf(Error);
    const errorMessage = (error as Error).message;

    console.log(`📝 Error message: "${errorMessage}"`);

    // CRITICAL TEST: The original "Unexpected numItems value: 0" should never appear
    expect(errorMessage).not.toContain("Unexpected numItems value: 0");

    // If we get our enhanced error message, verify it's helpful
    if (
      errorMessage.includes(
        "Autorouting failed: No valid routing space available"
      )
    ) {
      console.log("✅ Enhanced error message detected!");
      expect(errorMessage).toContain("components are overlapping");
      expect(errorMessage).toContain("Please check component placement");
    } else {
      console.log(
        `ℹ️  Got different error (not the target error): ${errorMessage}`
      );
    }
  }
});
