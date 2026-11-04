import { expect, test } from "bun:test"
import { getJlcStackup } from "@tscircuit/jlcpcb-manufacturing-specs"
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

const SVG_WIDTH = 760
const MAX_LINE_CHARS = 90

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const wrapText = (text: string) => {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(" ")) {
    if (line && line.length + word.length + 1 > MAX_LINE_CHARS) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Shows the stackup count and every stackup error/warning message verbatim. */
const createStackupMessagesSvg = ({
  stackupCount,
  messages,
}: {
  stackupCount: number
  messages: { type: string; message: string }[]
}) => {
  const rows: string[] = [
    `<text x="16" y="30" font-size="16" font-weight="700" fill="#111">thickness omitted (default 1.4mm)</text>`,
    `<text x="16" y="52" font-size="13" fill="#444">layers={4} fabricatorPreset="jlcpcb_standard"</text>`,
    `<text x="16" y="84" font-size="14" font-weight="700" fill="#c62828">pcb_stackup count: ${stackupCount}</text>`,
  ]
  let y = 116
  if (messages.length === 0) {
    rows.push(
      `<text x="16" y="${y}" font-size="14" font-weight="700" fill="#c62828">no error or warning mentions the stackup</text>`,
    )
    y += 24
  }
  for (const { type, message } of messages) {
    rows.push(
      `<text x="16" y="${y}" font-size="14" font-weight="700" fill="#b26a00">${type}</text>`,
    )
    y += 22
    for (const line of wrapText(message)) {
      rows.push(
        `<text x="16" y="${y}" font-size="13" font-family="monospace" fill="#111">${escapeXml(line)}</text>`,
      )
      y += 18
    }
    y += 12
  }
  const height = y + 8
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${height}" viewBox="0 0 ${SVG_WIDTH} ${height}" font-family="Arial, sans-serif">
<rect x="0" y="0" width="${SVG_WIDTH}" height="${height}" fill="#fafafa" />
${rows.join("\n")}
</svg>`
}

test("repro: jlcpcb_standard preset with the default board thickness warns that no pcb_stackup was emitted", async () => {
  expect(
    getJlcStackup({ num_layers: 4, thickness: 1.4, material: "fr4" }),
  ).toBeUndefined()

  const defaultThickness = await renderBoard()
  expect(defaultThickness.db.pcb_board.list()[0].thickness).toBe(1.4)
  const stackupMessages = defaultThickness
    .getCircuitJson()
    .filter(
      (element) =>
        (element.type.includes("error") || element.type.includes("warning")) &&
        JSON.stringify(element).toLowerCase().includes("stackup"),
    )
    .map((element) => ({
      type: element.type,
      message: "message" in element ? String(element.message) : "",
    }))
  expect(defaultThickness.db.pcb_stackup.list()).toHaveLength(0)
  expect(stackupMessages).toHaveLength(1)
  expect(stackupMessages[0].type).toBe("source_property_ignored_warning")
  expect(stackupMessages[0].message).toMatchInlineSnapshot(
    `"fabricatorPreset "jlcpcb_standard" has no stackup template for a 4-layer 1.4mm fr4 board, so no pcb_stackup was emitted. Supported thicknesses for 4-layer fr4: 0.4mm, 0.6mm, 0.8mm, 1mm, 1.2mm, 1.6mm, 1.8mm, 2mm, 2.5mm, 3mm. Set thickness on <board> to one of these."`,
  )

  // An explicit thickness that has a JLC template works.
  const explicitThickness = await renderBoard(1.6)
  expect(explicitThickness.db.pcb_stackup.list()).toHaveLength(1)
  expect(
    explicitThickness.db.source_property_ignored_warning.list(),
  ).toHaveLength(0)

  await expect(
    createStackupMessagesSvg({
      stackupCount: defaultThickness.db.pcb_stackup.list().length,
      messages: stackupMessages,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
