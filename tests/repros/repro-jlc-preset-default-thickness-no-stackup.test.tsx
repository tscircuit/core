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
// Boards now default to the standard 1.6mm thickness, which has a JLC
// stackup template. Explicit unsupported thicknesses still warn (see
// board-stackup-unsupported6).
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
  boardThickness,
  stackupCount,
  messages,
}: {
  boardThickness: number
  stackupCount: number
  messages: { type: string; message: string }[]
}) => {
  const statusColor = stackupCount > 0 ? "#2e7d32" : "#c62828"
  const rows: string[] = [
    `<text x="16" y="30" font-size="16" font-weight="700" fill="#111">thickness omitted (default ${boardThickness}mm)</text>`,
    `<text x="16" y="52" font-size="13" fill="#444">layers={4} fabricatorPreset="jlcpcb_standard"</text>`,
    `<text x="16" y="84" font-size="14" font-weight="700" fill="${statusColor}">pcb_stackup count: ${stackupCount}</text>`,
  ]
  let y = 116
  if (messages.length === 0) {
    rows.push(
      `<text x="16" y="${y}" font-size="14" font-weight="700" fill="${statusColor}">no error or warning mentions the stackup</text>`,
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

test("repro: jlcpcb_standard preset with the default board thickness defaults to 1.6mm and emits a pcb_stackup", async () => {
  expect(
    getJlcStackup({ num_layers: 4, thickness: 1.4, material: "fr4" }),
  ).toBeUndefined()

  const defaultThickness = await renderBoard()
  expect(defaultThickness.db.pcb_board.list()[0].thickness).toBe(1.6)
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
  expect(defaultThickness.db.pcb_stackup.list()).toHaveLength(1)
  expect(stackupMessages).toHaveLength(0)

  await expect(
    createStackupMessagesSvg({
      boardThickness: defaultThickness.db.pcb_board.list()[0].thickness!,
      stackupCount: defaultThickness.db.pcb_stackup.list().length,
      messages: stackupMessages,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
