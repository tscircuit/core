import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { SCHEMATIC_COMPONENT_OUTLINE_COLOR } from "lib/utils/constants"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SCHEMATIC_COMPONENT_OUTLINE_COLOR uses portable rgb(132, 0, 0) in circuit json and svg", async () => {
  expect(SCHEMATIC_COMPONENT_OUTLINE_COLOR).toBe("rgb(132, 0, 0)")

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect
              schX={0}
              schY={0}
              width={4}
              height={4}
              isFilled={false}
            />
            <schematicline x1={-2} y1={0} x2={2} y2={0} />
            <schematiccircle
              center={{ x: 0, y: 0 }}
              radius={1}
              isFilled={false}
            />
            <schematicarc
              center={{ x: 0, y: 0 }}
              radius={1.5}
              startAngleDegrees={0}
              endAngleDegrees={180}
            />
            <port
              name="IN"
              schX={-2.6}
              schY={0}
              direction="left"
              schStemLength={0.6}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const rects = circuit.db.schematic_rect.list()
  const lines = circuit.db.schematic_line.list()
  const circles = circuit.db.schematic_circle.list()
  const arcs = circuit.db.schematic_arc.list()

  expect(rects.length).toBeGreaterThanOrEqual(1)
  expect(lines.length).toBeGreaterThanOrEqual(2)
  expect(circles.length).toBeGreaterThanOrEqual(1)
  expect(arcs.length).toBeGreaterThanOrEqual(1)

  for (const el of [...rects, ...lines, ...circles, ...arcs]) {
    expect(el.color).toBe("rgb(132, 0, 0)")
  }

  const circuitJson = circuit.getCircuitJson()
  const svg = convertCircuitJsonToSchematicSvg(circuitJson)
  expect(svg).toContain("rgb(132, 0, 0)")
  expect(svg).not.toContain("rgba(132, 0, 0)")
})
