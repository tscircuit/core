import { expect, test } from "bun:test"
import type { PcbBoard } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import circuitJson from "./assets/simple-circuit.json"

test("panel with boards from circuitJson", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel
      tabWidth="0.4mm"
      tabLength="0.8mm"
      width="100mm"
      height="100mm"
      layoutMode="grid"
    >
      <board circuitJson={circuitJson as any} />
      <board circuitJson={circuitJson as any} />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
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

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-explicit-positions")
})
