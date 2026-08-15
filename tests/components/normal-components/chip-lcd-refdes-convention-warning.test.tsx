import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const escapeSvgText = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

const addRefdesWarningLabels = (svg: string, messages: string[]): string => {
  if (messages.length === 0) {
    const validStatus =
      '<g data-type="refdes-convention-valid"><rect x="0" y="0" width="800" height="46" fill="#d8f5df"/><text x="400" y="29" fill="#087a30" font-family="sans-serif" font-size="16" text-anchor="middle">LCD IS A VALID MULTI-LETTER PREFIX</text></g>'
    return svg.replace("</svg>", `${validStatus}</svg>`)
  }

  const warningLabels = messages
    .map(
      (message, index) =>
        `<text x="400" y="${28 + index * 18}" fill="red" font-family="sans-serif" font-size="14" text-anchor="middle" data-type="refdes-convention-warning">${escapeSvgText(message)}</text>`,
    )
    .join("")

  return svg.replace("</svg>", `${warningLabels}</svg>`)
}

test("LCD1 is not an inductor-style L reference designator", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board>
      <chip
        name="LCD1"
        pinLabels={{
          pin1: "SEG_A",
          pin2: "SEG_B",
          pin3: "COMMON",
        }}
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const warnings = circuitJson.filter(
    (element) => element.type === "source_refdes_convention_warning",
  )

  expect(warnings).toHaveLength(0)

  expect(
    addRefdesWarningLabels(
      convertCircuitJsonToSchematicSvg(circuitJson),
      warnings.map(({ message }) => message),
    ),
  ).toMatchSvgSnapshot(import.meta.path)
})
