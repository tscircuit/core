import { expect, test } from "bun:test"
import { getSchematicElementBounds } from "@tscircuit/circuit-json-util"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { SchematicSection } from "lib/components/primitive-components/SchematicSection"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const AXIS_ALIGNMENT_TOLERANCE = 0.001

test("schematic section dividers do not cross net labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" schMaxTraceDistance={0.1} routingDisabled>
      <net name="UART_RX_BREAKOUT" />
      <schematicsection name="top_left" displayName="Top left" />
      <schematicsection name="top_right" displayName="Top right" />
      <schematicsection name="bottom" displayName="Bottom interface" />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        schX={-4}
        schY={3}
        schSectionName="top_left"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        schX={4}
        schY={3}
        schSectionName="top_right"
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        schX={-3}
        schY={-3}
        schSectionName="bottom"
      />
      <netlabel
        net="UART_RX_BREAKOUT"
        connectsTo=".R3 > .pin1"
        schX={4.5}
        schY={-3}
        anchorSide="left"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const netLabel = circuit.db.schematic_net_label
    .list()
    .find((label) => label.text === "UART_RX_BREAKOUT")
  expect(netLabel).toBeDefined()
  if (!netLabel) throw new Error("expected UART_RX_BREAKOUT net label")

  const bounds = getSchematicElementBounds(netLabel)
  expect(bounds).not.toBeNull()
  if (!bounds) throw new Error("expected net label bounds")

  const board = circuit.firstChild
  if (!(board instanceof PrimitiveComponent)) {
    throw new Error("expected board primitive")
  }
  const bottomSection = board.children.find(
    (child) =>
      child instanceof SchematicSection && child._parsedProps.name === "bottom",
  )
  expect(bottomSection).toBeDefined()
  if (!(bottomSection instanceof SchematicSection)) {
    throw new Error("expected bottom schematic section")
  }
  const sectionBounds = bottomSection._computeSectionBounds(
    board,
    "bottom",
    undefined,
  )
  expect(sectionBounds?.maxX).toBeGreaterThanOrEqual(bounds.maxX)

  const dividerCrossesLabel = circuit.db.schematic_line.list().some((line) => {
    const isHorizontal = Math.abs(line.y1 - line.y2) < AXIS_ALIGNMENT_TOLERANCE
    if (isHorizontal) {
      return (
        line.y1 >= bounds.minY &&
        line.y1 <= bounds.maxY &&
        Math.max(line.x1, line.x2) >= bounds.minX &&
        Math.min(line.x1, line.x2) <= bounds.maxX
      )
    }
    return (
      line.x1 >= bounds.minX &&
      line.x1 <= bounds.maxX &&
      Math.max(line.y1, line.y2) >= bounds.minY &&
      Math.min(line.y1, line.y2) <= bounds.maxY
    )
  })
  expect(dividerCrossesLabel).toBe(false)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
