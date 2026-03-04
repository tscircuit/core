import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel with boards with different outlines and subpanels manual placement", () => {
  const { circuit } = getTestFixture()

  // 4x2 grid of boards with manual placement
  const board1_outline = [
    // Pentagon
    { x: -70, y: -30 },
    { x: -50, y: -30 },
    { x: -50, y: -15 },
    { x: -60, y: -10 },
    { x: -70, y: -15 },
  ]
  const board2_outline = [
    // Rhombus
    { x: 20, y: -30 },
    { x: 30, y: -20 },
    { x: 20, y: -10 },
    { x: 10, y: -20 },
  ]
  const board3_outline = [
    // C-Shape
    { x: -30, y: 10 },
    { x: -10, y: 10 },
    { x: -10, y: 15 },
    { x: -25, y: 15 },
    { x: -25, y: 25 },
    { x: -10, y: 25 },
    { x: -10, y: 30 },
    { x: -30, y: 30 },
  ]
  const board4_outline = [
    // Octagon
    { x: 55, y: 10 },
    { x: 65, y: 10 },
    { x: 70, y: 15 },
    { x: 70, y: 25 },
    { x: 65, y: 30 },
    { x: 55, y: 30 },
    { x: 50, y: 25 },
    { x: 50, y: 15 },
  ]
  const board5_outline = [
    // Hexagon
    { x: -50, y: 20 },
    { x: -55, y: 28.7 },
    { x: -65, y: 28.7 },
    { x: -70, y: 20 },
    { x: -65, y: 11.3 },
    { x: -55, y: 11.3 },
  ]
  const board6_outline = [
    // T-shape
    { x: -30, y: -15 },
    { x: -22.5, y: -15 },
    { x: -22.5, y: -30 },
    { x: -17.5, y: -30 },
    { x: -17.5, y: -15 },
    { x: -10, y: -15 },
    { x: -10, y: -10 },
    { x: -30, y: -10 },
  ]
  const board7_outline = [
    // U-shape
    { x: 10, y: 30 },
    { x: 30, y: 30 },
    { x: 30, y: 10 },
    { x: 25, y: 10 },
    { x: 25, y: 25 },
    { x: 15, y: 25 },
    { x: 15, y: 10 },
    { x: 10, y: 10 },
  ]
  const board8_outline = [
    // Plus-shape
    { x: 57.5, y: -10 },
    { x: 62.5, y: -10 },
    { x: 62.5, y: -17.5 },
    { x: 70, y: -17.5 },
    { x: 70, y: -22.5 },
    { x: 62.5, y: -22.5 },
    { x: 62.5, y: -30 },
    { x: 57.5, y: -30 },
    { x: 57.5, y: -22.5 },
    { x: 50, y: -22.5 },
    { x: 50, y: -17.5 },
    { x: 57.5, y: -17.5 },
  ]

  circuit.add(
    <panel
      panelizationMethod="tab-routing"
      layoutMode="none"
      width={200}
      height={100}
    >
      <subpanel pcbX={-60} pcbY={-20}>
        <board outline={board1_outline} routingDisabled>
          <resistor name="R1" resistance="1k" footprint="0805" />
        </board>
      </subpanel>
      <subpanel pcbX={20} pcbY={-20}>
        <board outline={board2_outline} routingDisabled>
          <resistor name="R2" resistance="1k" footprint="0805" />
        </board>
      </subpanel>
      <subpanel pcbX={-20} pcbY={20}>
        <board outline={board3_outline} routingDisabled>
          <resistor name="R3" resistance="1k" footprint="0805" pcbY={7} />
        </board>
      </subpanel>
      <subpanel pcbX={60} pcbY={20}>
        <board outline={board4_outline} routingDisabled>
          <resistor name="R4" resistance="1k" footprint="0805" />
        </board>
      </subpanel>
      <subpanel pcbX={-60} pcbY={20}>
        <board outline={board5_outline} routingDisabled>
          <resistor name="R5" resistance="1k" footprint="0805" />
        </board>
      </subpanel>
      <subpanel pcbX={-20} pcbY={-20}>
        <board outline={board6_outline} routingDisabled>
          <resistor name="R6" resistance="1k" footprint="0805" />
        </board>
      </subpanel>
      <subpanel pcbX={20} pcbY={20}>
        <board outline={board7_outline} routingDisabled>
          <resistor name="R7" resistance="1k" footprint="0805" pcbY={7} />
        </board>
      </subpanel>
      <subpanel pcbX={60} pcbY={-20}>
        <board outline={board8_outline} routingDisabled>
          <resistor name="R8" resistance="1k" footprint="0805" />
        </board>
      </subpanel>
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
