import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Keepout component rendering", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <keepout shape="rect" width="5mm" height="3mm" pcbX="-10mm" pcbY="0mm" />
      <keepout shape="circle" radius="2mm" pcbX="0mm" pcbY="0mm" />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
