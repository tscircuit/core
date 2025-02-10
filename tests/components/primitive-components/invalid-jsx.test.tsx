import { test, expect } from "bun:test"
import { Circuit } from "lib"

test("snippet-import1-contribution-board", async () => {
  const circuit = new Circuit()

  expect(() => {
    circuit.add(
      <board width="10mm" height="10mm">
        {1}
      </board>,
    )
  }).toThrowError("Invalid JSX Element")
})
