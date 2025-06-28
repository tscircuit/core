import { test, expect } from "bun:test"
import { Circuit } from "lib"
import * as tscircuitCore from "lib"

test.skip("snippet-import1-contribution-board", async () => {
  // Import moved inside test to avoid module resolution issues when @tscircuit/core is not installed
  const { importSnippet } = await import("@tscircuit/import-snippet")
  
  const ContributionBoard = await importSnippet("seveibar/contribution-board", {
    dependencies: {
      "@tscircuit/core": tscircuitCore,
    },
  })

  const circuit = new Circuit()

  circuit.add(<ContributionBoard />)

  const circuitJson = circuit.getCircuitJson()
})
