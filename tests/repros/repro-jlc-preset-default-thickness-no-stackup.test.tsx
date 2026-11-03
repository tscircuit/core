import { expect, test } from "bun:test"
import { getJlcStackup } from "@tscircuit/jlcpcb-manufacturing-specs"
import type { PcbStackup } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Found while running `tsci simulate` on a 4-layer pcb_spice DDR channel: the
// pipeline failed with "Board pcb_board_0 has no pcb_stackup. Set
// fabricatorPreset (e.g. "jlcpcb_standard")..." even though the board already
// set fabricatorPreset="jlcpcb_standard".
//
// Cause: the default board thickness is 1.4mm and the JLC stackup templates
// have no 1.4mm entry, so Board_doInitialPcbStackupRender inserts nothing.
// board-stackup-unsupported3 covers this as intended; a
// source_property_ignored_warning now explains why no stackup was emitted.
const renderBoard = async (thickness?: number) => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={10}
      height={10}
      layers={4}
      thickness={thickness}
      fabricatorPreset="jlcpcb_standard"
      routingDisabled
    >
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}

const PANEL_WIDTH = 380
const PANEL_HEIGHT = 380
const LAYER_COLORS = {
  copper: "#d98c2b",
  prepreg: "#9ccf8f",
  core: "#5f9e6e",
  soldermask: "#2e7d4f",
} as const

/** Board cross-section, top to bottom. Thin layers get a minimum height. */
const createStackupPanelSvg = ({
  x,
  title,
  subtitle,
  stackup,
}: {
  x: number
  title: string
  subtitle: string
  stackup?: PcbStackup
}) => {
  const rows: string[] = [
    `<text x="${x + 16}" y="30" font-size="16" font-weight="700" fill="#111">${title}</text>`,
    `<text x="${x + 16}" y="52" font-size="13" fill="#444">${subtitle}</text>`,
  ]
  if (!stackup) {
    rows.push(
      `<rect x="${x + 16}" y="72" width="${PANEL_WIDTH - 32}" height="280" fill="none" stroke="#c62828" stroke-width="2" stroke-dasharray="8 6" />`,
      `<text x="${x + PANEL_WIDTH / 2}" y="204" font-size="18" font-weight="700" fill="#c62828" text-anchor="middle">no pcb_stackup emitted</text>`,
      `<text x="${x + PANEL_WIDTH / 2}" y="230" font-size="13" fill="#c62828" text-anchor="middle">source_property_ignored_warning explains why</text>`,
    )
    return rows.join("\n")
  }
  let y = 72
  for (const layer of stackup.layers) {
    const thickness = layer.thickness ?? 0
    const height = Math.max(22, thickness * 110)
    const kind =
      layer.layer_type === "dielectric"
        ? (layer.dielectric_type ?? "core")
        : layer.layer_type
    const color = LAYER_COLORS[kind as keyof typeof LAYER_COLORS] ?? "#bbb"
    const name =
      layer.layer_type === "copper"
        ? `${layer.layer} copper`
        : ("material_name" in layer && layer.material_name) || kind
    const er =
      "relative_permittivity" in layer && layer.relative_permittivity
        ? `  εr ${layer.relative_permittivity}`
        : ""
    rows.push(
      `<rect x="${x + 16}" y="${y}" width="${PANEL_WIDTH - 32}" height="${height}" fill="${color}" stroke="#333" stroke-width="0.5" />`,
      `<text x="${x + 24}" y="${y + height / 2 + 4}" font-size="12" fill="#111">${name}  ${thickness}mm${er}</text>`,
    )
    y += height
  }
  return rows.join("\n")
}

test("repro: jlcpcb_standard preset with the default board thickness warns that no pcb_stackup was emitted", async () => {
  expect(
    getJlcStackup({ num_layers: 4, thickness: 1.4, material: "fr4" }),
  ).toBeUndefined()

  const defaultThickness = await renderBoard()
  expect(defaultThickness.db.pcb_board.list()[0].thickness).toBe(1.4)
  expect(defaultThickness.db.pcb_stackup.list()).toHaveLength(0)
  const warnings = defaultThickness.db.source_property_ignored_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].property_name).toBe("fabricatorPreset")
  expect(warnings[0].message).toMatchInlineSnapshot(
    `"fabricatorPreset "jlcpcb_standard" has no stackup template for a 4-layer 1.4mm fr4 board, so no pcb_stackup was emitted. Supported thicknesses for 4-layer fr4: 0.4mm, 0.6mm, 0.8mm, 1mm, 1.2mm, 1.6mm, 1.8mm, 2mm, 2.5mm, 3mm. Set thickness on <board> to one of these."`,
  )

  // An explicit thickness that has a JLC template works.
  const explicitThickness = await renderBoard(1.6)
  expect(explicitThickness.db.pcb_stackup.list()).toHaveLength(1)
  expect(
    explicitThickness.db.source_property_ignored_warning.list(),
  ).toHaveLength(0)

  const comparisonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PANEL_WIDTH * 2}" height="${PANEL_HEIGHT}" viewBox="0 0 ${PANEL_WIDTH * 2} ${PANEL_HEIGHT}" font-family="Arial, sans-serif">
<rect x="0" y="0" width="${PANEL_WIDTH * 2}" height="${PANEL_HEIGHT}" fill="#fafafa" />
<line x1="${PANEL_WIDTH}" y1="12" x2="${PANEL_WIDTH}" y2="${PANEL_HEIGHT - 12}" stroke="#ddd" />
${createStackupPanelSvg({
  x: 0,
  title: "thickness omitted (default 1.4mm)",
  subtitle: 'layers={4} fabricatorPreset="jlcpcb_standard"',
})}
${createStackupPanelSvg({
  x: PANEL_WIDTH,
  title: "thickness={1.6}",
  subtitle: 'layers={4} fabricatorPreset="jlcpcb_standard"',
  stackup: explicitThickness.db.pcb_stackup.list()[0],
})}
</svg>`
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
