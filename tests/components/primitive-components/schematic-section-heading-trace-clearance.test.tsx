import { expect, test } from "bun:test"
import { getSchematicTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function hasTraceCrossingTitle(circuit: any, titleText: string): boolean {
  const title = circuit.db.schematic_text
    .list()
    .find((text: any) => text.text === titleText)
  expect(title).toBeDefined()

  const bounds = getSchematicTextBounds({
    text: title.text,
    position: title.position,
    anchor: title.anchor,
    fontSize: title.font_size,
  })

  const edges = circuit.db.schematic_trace
    .list()
    .filter((t: any) => t.schematic_sheet_id === title.schematic_sheet_id)
    .flatMap((trace: any) => trace.edges)
  expect(edges.length).toBeGreaterThan(0)

  return edges.some(({ from, to }: any) => {
    const isHorizontal = Math.abs(from.y - to.y) < 1e-6
    if (isHorizontal) {
      return (
        from.y > bounds.minY &&
        from.y < bounds.maxY &&
        Math.max(from.x, to.x) > bounds.minX &&
        Math.min(from.x, to.x) < bounds.maxX
      )
    }
    const isVertical = Math.abs(from.x - to.x) < 1e-6
    if (isVertical) {
      return (
        from.x > bounds.minX &&
        from.x < bounds.maxX &&
        Math.max(from.y, to.y) > bounds.minY &&
        Math.min(from.y, to.y) < bounds.maxY
      )
    }
    return false
  })
}

test("routed schematic traces stay clear of SchematicSection headings", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })

  circuit.add(
    <board schTraceAutoLabelEnabled>
      <schematicsection name="UI" displayName="Display and rotary control" />
      <connector
        name="J_MAIN"
        pinLabels={Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [`pin${i + 1}`, `pin${i + 1}`]),
        )}
        schSectionName="UI"
        schX={-10}
        schY={0}
        schWidth={2}
        schHeight={1.4}
      />
      <capacitor
        name="C_PANEL"
        capacitance="1uF"
        schSectionName="UI"
        schX={-6}
        schY={7}
        schRotation={-90}
      />
      <trace from=".J_MAIN > .pin1" to=".C_PANEL > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(hasTraceCrossingTitle(circuit, "Display and rotary control")).toBe(
    false,
  )
})

test("SchematicSection heading clears routed trace beneath a horizontal section divider", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })

  circuit.add(
    <board schTraceAutoLabelEnabled>
      <schematicsection name="TOP" displayName="Upper control" />
      <schematicsection name="UI" displayName="Display and rotary control" />
      <resistor
        name="R_TOP"
        resistance="10k"
        schSectionName="TOP"
        schX={-8}
        schY={11}
      />
      <connector
        name="J_MAIN"
        pinLabels={Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [`pin${i + 1}`, `pin${i + 1}`]),
        )}
        schSectionName="UI"
        schX={-10}
        schY={0}
        schWidth={2}
        schHeight={1.4}
      />
      <capacitor
        name="C_PANEL"
        capacitance="1uF"
        schSectionName="UI"
        schX={-6}
        schY={7}
        schRotation={-90}
      />
      <trace from=".J_MAIN > .pin1" to=".C_PANEL > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(hasTraceCrossingTitle(circuit, "Display and rotary control")).toBe(
    false,
  )

  const divider = circuit.db.schematic_line.list()[0]
  const lowerTitle = circuit.db.schematic_text
    .list()
    .find((t) => t.text === "Display and rotary control")!
  expect(lowerTitle.position.y).toBeLessThan(divider!.y1)
})
