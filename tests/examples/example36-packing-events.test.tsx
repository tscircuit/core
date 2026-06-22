import { expect, test } from "bun:test"
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

  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}packing-true`)

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

  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}packing-false`)

  // Packing should NOT run when components have explicit positions
  expect(packingStarted).toBe(false)
})

test("solver:started fires with packing solver details", async () => {
  const { circuit } = getTestFixture()
  let solverStartedEvent: any

  circuit.on("solver:started", (event) => {
    solverStartedEvent = event
  })

  circuit.add(
    <board routingDisabled>
      <resistor name="R1" footprint={"0402"} resistance={"100"} />
      <capacitor name="C1" footprint={"0402"} capacitance={"100nF"} />
    </board>,
  )

  circuit.render()

  expect(solverStartedEvent?.solverName).toBe("PackSolver2")
  expect(solverStartedEvent?.componentName.replace(/#\d+/, "#")).toBe(
    "<board# />",
  )
  expect(solverStartedEvent?.solverParams).toMatchObject({
    minGap: expect.any(Number),
  })
})

test("shouldBeOnEdgeOfBoard is forwarded to PackSolver2", async () => {
  const { circuit } = getTestFixture()
  let solverStartedEvent: any

  circuit.on("solver:started", (event) => {
    if (event.solverName === "PackSolver2") {
      solverStartedEvent = event
    }
  })

  circuit.add(
    <board width="20mm" height="10mm" pcbPack routingDisabled>
      <resistor
        name="J1"
        footprint="0402"
        resistance="100"
        shouldBeOnEdgeOfBoard
      />
      <capacitor name="C1" footprint="0402" capacitance="100nF" />
    </board>,
  )

  circuit.render()

  const boundaryComponents = solverStartedEvent?.solverParams.components.filter(
    (component: any) => component.mustBeOnBoundary,
  )

  expect(boundaryComponents).toHaveLength(1)
})
