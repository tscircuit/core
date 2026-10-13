import { beforeAll, expect, test } from "bun:test"
import { doesSegmentIntersectRect } from "@tscircuit/math-utils"
import { getNetLabelTextBounds } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/getNetLabelTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { BSS123LT1G } from "./assets/nema34-vbus-lv/bss123lt1g"

const { circuit } = getTestFixture()
circuit.pcbDisabled = true
circuit.add(
  <board width={10} height={10}>
    <net name="VBUS_LV" isPowerNet />
    <net name="PD_VBUS" isPowerNet />
    <net name="EPR_BLK_GATE" isPowerNet={false} />
    <BSS123LT1G
      name="Q1"
      schX={5}
      schY={-0.5}
      schRotation={90}
      connections={{
        gate: "net.EPR_BLK_GATE",
        source: "net.VBUS_LV",
        drain: "net.PD_VBUS",
      }}
    />
  </board>,
)

const getVbusLabel = () =>
  circuit.db.schematic_net_label
    .list()
    .find((label) => label.text === "VBUS_LV")!

const getSourceStem = () => {
  const sourcePort = circuit.db.schematic_port
    .list()
    .find((port) => port.pin_number === 2)!
  return circuit.db.schematic_line
    .list()
    .find(
      (line) =>
        line.x1 === sourcePort.center.x && line.y1 === sourcePort.center.y,
    )!
}

beforeAll(async () => {
  await circuit.renderUntilSettled()

  expect(getVbusLabel().symbol_name).toBe("rail_up")
  expect(getSourceStem().y2 - getSourceStem().y1).toBeCloseTo(0.635)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})

// The routing envelope includes external terminals, so the upward rail must
// connect around the symbol instead of pointing back along its source stem.
test("NEMA34 Q1 VBUS_LV text clears the custom MOSFET source stem", () => {
  const label = getVbusLabel()
  const stem = getSourceStem()
  const labelAnchor = label.anchor_position!
  // Emitted schematic-world points in mm: +X right, +Y up. These are the drawn
  // stem endpoints, not a reconstruction of the symbol's transform.
  expect(
    doesSegmentIntersectRect(
      { x: stem.x1, y: stem.y1 },
      { x: stem.x2, y: stem.y2 },
      getNetLabelTextBounds(label),
    ),
  ).toBe(false)

  // The relocated rail must remain connected to the source terminal.
  expect(
    circuit.db.schematic_trace.list().some((trace) => {
      const points = trace.edges.flatMap((edge) => [edge.from, edge.to])
      return (
        points.some((point) => point.x === stem.x1 && point.y === stem.y1) &&
        points.some(
          (point) => point.x === labelAnchor.x && point.y === labelAnchor.y,
        )
      )
    }),
  ).toBe(true)
})
