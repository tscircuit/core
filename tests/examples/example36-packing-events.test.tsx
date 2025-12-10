import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("packing:start fires when components don't have pcbX/pcbY", async () => {
  const { circuit } = getTestFixture()
  let packingStarted = false
  circuit.on("packing:start", () => {
    packingStarted = true
  })

  circuit.add(
    <board routingDisabled>
      <resistor name="R1" footprint={"0402"} resistance={"100"} />
      <capacitor name="C1" footprint={"0402"} capacitance={"100nF"} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "packing-true")

  // Packing should run when components don't have explicit positions
  expect(packingStarted).toBe(true)
})

test("packing:start does NOT fire when components have pcbX/pcbY", async () => {
  const { circuit } = getTestFixture()
  let packingStarted = false
  circuit.on("packing:start", () => {
    packingStarted = true
  })

  circuit.add(
    <board routingDisabled>
      <resistor
        name="R1"
        footprint={"0402"}
        resistance={"100"}
        pcbX={0}
        pcbY={0}
      />
      <capacitor
        name="C1"
        footprint={"0402"}
        capacitance={"100nF"}
        pcbX={3}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "packing-false")

  // Packing should NOT run when components have explicit positions
  expect(packingStarted).toBe(false)
})
