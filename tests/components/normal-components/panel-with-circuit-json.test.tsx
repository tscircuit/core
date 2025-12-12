import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbBoard } from "circuit-json"
import circuitJson from "./assets/simple-circuit.json"

test("panel with boards from circuitJson", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel tabWidth="0.4mm" tabLength="0.8mm" width="100mm" height="100mm">
      <board circuitJson={circuitJson as any} />
      <board circuitJson={circuitJson as any} />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
  })
})

test("panel with boards from circuitJson with explicit positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel tabWidth="0.4mm" tabLength="0.8mm" width="100mm" height="100mm">
      <board pcbX={20} circuitJson={circuitJson as any} />
      <board pcbX={-20} circuitJson={circuitJson as any} />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-explicit-positions", {
    showAnchorOffsets: true,
  })
})
