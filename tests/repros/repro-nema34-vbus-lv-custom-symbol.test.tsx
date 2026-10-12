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

  // Keep setup/snapshot failures outside test.failing, so they cannot disguise
  // a broken fixture as a successful reproduction.
  expect(getVbusLabel().symbol_name).toBe("rail_up")
  expect(getSourceStem().y2 - getSourceStem().y1).toBeCloseTo(0.635)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})

// Known bug: the rail is allowed to point back along the custom symbol's stem.
// Expected: keep the power rail pointing up, but route it clear of the symbol.
test.failing(
  "NEMA34 Q1 VBUS_LV text clears the custom MOSFET source stem",
  () => {
    const label = getVbusLabel()
    const stem = getSourceStem()
    // Emitted schematic-world points in mm: +X right, +Y up. These are the drawn
    // stem endpoints, not a reconstruction of the symbol's transform.
    expect(
      doesSegmentIntersectRect(
        { x: stem.x1, y: stem.y1 },
        { x: stem.x2, y: stem.y2 },
        getNetLabelTextBounds(label),
      ),
    ).toBe(false)
  },
)
