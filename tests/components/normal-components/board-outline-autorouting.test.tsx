import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("Board outline should be passed to autorouter", () => {
  const { circuit } = getTestFixture()

  // Create a board with a custom outline
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      outline={[
        { x: -10, y: -10 },
        { x: 10, y: -10 },
        { x: 10, y: 10 },
        { x: -5, y: 10 },
        { x: -5, y: 5 },
        { x: -10, y: 5 },
      ]}
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()

  // Find the pcb_board element
  const pcbBoard = circuitJson.find((e: any) => e.type === "pcb_board") as any

  // Verify the outline is present in the board
  expect(pcbBoard).toBeDefined()
  expect(pcbBoard.outline).toBeDefined()
  expect(pcbBoard.outline).toEqual([
    { x: -10, y: -10 },
    { x: 10, y: -10 },
    { x: 10, y: 10 },
    { x: -5, y: 10 },
    { x: -5, y: 5 },
    { x: -10, y: 5 },
  ])
})

test("Board with rounded corners should generate outline", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" borderRadius={2}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()

  // Find the pcb_board element
  const pcbBoard = circuitJson.find((e: any) => e.type === "pcb_board") as any

  // Verify the outline is present for rounded corners
  expect(pcbBoard).toBeDefined()
  expect(pcbBoard.outline).toBeDefined()
  expect(Array.isArray(pcbBoard.outline)).toBe(true)
  expect(pcbBoard.outline.length).toBeGreaterThan(4) // More than 4 points for rounded corners
})
