import { beforeAll, expect, test } from "bun:test"
import { getSchematicTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })

beforeAll(async () => {
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
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, { grid: false })
})

// The title is placed automatically; no text or route coordinates are supplied.
test.failing(
  "the J_MAIN to C_PANEL trace stays clear of the section heading",
  () => {
    const title = circuit.db.schematic_text
      .list()
      .find((text) => text.text === "Display and rotary control")!
    const bounds = getSchematicTextBounds({
      text: title.text,
      position: title.position,
      anchor: title.anchor,
      fontSize: title.font_size,
    })
    const crossing = circuit.db.schematic_trace
      .list()
      .flatMap((trace) => trace.edges)
      .some(
        ({ from, to }) =>
          Math.abs(from.y - to.y) < 1e-6 &&
          from.y > bounds.minY &&
          from.y < bounds.maxY &&
          Math.max(from.x, to.x) > bounds.minX &&
          Math.min(from.x, to.x) < bounds.maxX,
      )
    expect(crossing).toBe(false)
  },
)
