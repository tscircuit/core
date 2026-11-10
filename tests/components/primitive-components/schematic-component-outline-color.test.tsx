import { expect, test } from "bun:test"
import { SCHEMATIC_COMPONENT_OUTLINE_COLOR } from "lib/utils/constants"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SCHEMATIC_COMPONENT_OUTLINE_COLOR uses portable rgb() syntax", async () => {
  expect(SCHEMATIC_COMPONENT_OUTLINE_COLOR).toBe("rgb(132, 0, 0)")

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect schX={0} schY={0} width={2} height={1} />
            <schematicline x1={-1} y1={-0.5} x2={1} y2={0.5} />
            <schematiccircle center={{ x: 0, y: 0 }} radius={0.3} />
            <schematicarc
              center={{ x: 0, y: 0 }}
              radius={0.4}
              startAngleDegrees={0}
              endAngleDegrees={180}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const rect = circuit.db.schematic_rect.list()[0]
  const line = circuit.db.schematic_line.list()[0]
  const circle = circuit.db.schematic_circle.list()[0]
  const arc = circuit.db.schematic_arc.list()[0]

  expect(rect?.color).toBe("rgb(132, 0, 0)")
  expect(line?.color).toBe("rgb(132, 0, 0)")
  expect(circle?.color).toBe("rgb(132, 0, 0)")
  expect(arc?.color).toBe("rgb(132, 0, 0)")
})
