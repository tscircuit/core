import { expect, test } from "bun:test"
import { SCHEMATIC_COMPONENT_OUTLINE_COLOR } from "lib/utils/constants"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SCHEMATIC_COMPONENT_OUTLINE_COLOR uses portable rgb(132, 0, 0) syntax across schematic primitives (#3982)", async () => {
  expect(SCHEMATIC_COMPONENT_OUTLINE_COLOR).toBe("rgb(132, 0, 0)")

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect schX={0} schY={0} width={2} height={1} />
            <schematicline x1={-1} y1={0} x2={-1.5} y2={0} />
            <schematiccircle center={{ x: 0, y: 0 }} radius={0.2} />
            <schematicarc
              center={{ x: 0, y: 0 }}
              radius={0.3}
              startAngleDegrees={0}
              endAngleDegrees={90}
            />
            <port
              name="pin1"
              direction="left"
              schX={-1.5}
              schY={0}
              schStemLength={0.4}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const rect = circuit.db.schematic_rect.list()[0]
  const lines = circuit.db.schematic_line.list()
  const circle = circuit.db.schematic_circle.list()[0]
  const arc = circuit.db.schematic_arc.list()[0]

  expect(rect?.color).toBe("rgb(132, 0, 0)")
  expect(lines.length).toBeGreaterThanOrEqual(2)
  for (const line of lines) {
    expect(line.color).toBe("rgb(132, 0, 0)")
  }
  expect(circle?.color).toBe("rgb(132, 0, 0)")
  expect(arc?.color).toBe("rgb(132, 0, 0)")
})
