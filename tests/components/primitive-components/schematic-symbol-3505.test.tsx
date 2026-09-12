import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type NetLabel = {
  center?: { x?: number; y?: number }
  text?: string
}
type SchematicPort = {
  display_pin_label?: string
  is_connected?: boolean
}

async function renderDualOpamp(opts: {
  explicitLabelCoords: boolean
}) {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <net name="V5" isPowerNet />
      <net name="GND" isGroundNet />

      <chip
        name="U3"
        footprint="soic8"
        noSchematicRepresentation
        pinLabels={{
          pin1: "OUT_A",
          pin2: "IN-_A",
          pin3: "IN+_A",
          pin4: "V-",
          pin5: "IN+_B",
          pin6: "IN-_B",
          pin7: "OUT_B",
          pin8: "V+",
        }}
      />

      <schematicsymbol
        name="U3A"
        chipRef=".U3"
        symbolName="opamp_with_power_right"
        connections={{
          inp1: "U3.pin3",
          inp2: "U3.pin2",
          out: "U3.pin1",
          "V+": "U3.pin8",
          "V-": "U3.pin4",
        }}
        schX={0}
        schY={0}
      />
      <schematicsymbol
        name="U3B"
        chipRef=".U3"
        symbolName="opamp_with_power_right"
        connections={{
          inp1: "U3.pin5",
          inp2: "U3.pin6",
          out: "U3.pin7",
          "V+": "U3.pin8",
          "V-": "U3.pin4",
        }}
        schX={5}
        schY={0}
      />

      <netlabel
        net="V5"
        connection="U3A.pin5"
        anchorSide="bottom"
        {...(opts.explicitLabelCoords ? { schX: -0.03, schY: 0.39 } : {})}
      />
      <netlabel
        net="GND"
        connection="U3A.pin3"
        anchorSide="top"
        {...(opts.explicitLabelCoords ? { schX: -0.02, schY: -0.39 } : {})}
      />
      <netlabel
        net="V5"
        connection="U3B.pin5"
        anchorSide="bottom"
        {...(opts.explicitLabelCoords ? { schX: 4.97, schY: 0.39 } : {})}
      />
      <netlabel
        net="GND"
        connection="U3B.pin3"
        anchorSide="top"
        {...(opts.explicitLabelCoords ? { schX: 4.98, schY: -0.39 } : {})}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const soup = circuit.getCircuitJson()
  const labels = soup.filter(
    (el: any) => el.type === "schematic_net_label",
  ) as NetLabel[]
  const ports = soup.filter(
    (el: any) => el.type === "schematic_port",
  ) as SchematicPort[]

  return { labels, ports }
}

test("#3505: coordinate-free netlabel on shared schematicsymbol projection does not throw", async () => {
  const { labels, ports } = await renderDualOpamp({
    explicitLabelCoords: false,
  })

  // Render must not throw: every netlabel has a position
  expect(labels.length).toBeGreaterThanOrEqual(4)
  for (const label of labels) {
    expect(label?.center).toBeDefined()
    expect(Number.isFinite(label.center!.x)).toBe(true)
    expect(Number.isFinite(label.center!.y)).toBe(true)
  }

  // Both projections' shared power/ground ports must be marked connected
  const v5Ports = ports.filter(
    (p) => p.display_pin_label === "V+" || p.display_pin_label === "V-",
  )
  expect(v5Ports.length).toBe(4)
  for (const port of v5Ports) {
    expect(port.is_connected).toBe(true)
  }
})

test("#3505: explicit-coordinate netlabel marks BOTH projections' shared power ports connected", async () => {
  const { labels, ports } = await renderDualOpamp({
    explicitLabelCoords: true,
  })

  expect(labels.length).toBeGreaterThanOrEqual(4)

  // Both U3A and U3B V+/V- schematic ports must be connected (previously
  // only the first projection was marked; the second stayed false)
  const v5Ports = ports.filter(
    (p) => p.display_pin_label === "V+" || p.display_pin_label === "V-",
  )
  expect(v5Ports.length).toBe(4)
  for (const port of v5Ports) {
    expect(port.is_connected).toBe(true)
  }
})