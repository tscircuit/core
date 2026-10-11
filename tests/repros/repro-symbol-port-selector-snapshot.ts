import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

type SelectorOutput = {
  portMatches: number
  originalPort: boolean
  savedPaths: number
}

export async function captureSelectorSnapshot(
  name: string,
  purpose: string,
  circuitJson: AnyCircuitElement[],
  output: SelectorOutput,
  expected: SelectorOutput,
) {
  if (!process.env.CAPTURE_SELECTOR_SNAPSHOT) return
  const pass = JSON.stringify(output) === JSON.stringify(expected)
  const svg = convertCircuitJsonToPcbSvg(circuitJson, {
    width: 800,
    height: 500,
    backgroundColor: "white",
    colorOverrides: { boardOutline: "#64748b" },
  }).replace(
    "</svg>",
    `<text x="400" y="25" text-anchor="middle" font-family="Arial" font-size="16" fill="#172033">tscircuit/core converts TSX circuits to Circuit JSON.</text><text x="400" y="47" text-anchor="middle" font-family="Arial" font-size="15" fill="#172033">${purpose}</text><text x="400" y="69" text-anchor="middle" font-family="Arial" font-size="15" fill="${pass ? "#15803d" : "#b91c1c"}">${pass ? "PASS" : "FAIL"}: port matches: ${output.portMatches}; original port: ${output.originalPort}; saved paths: ${output.savedPaths}.</text></svg>`,
  )
  await Bun.write(
    new URL(
      `./__snapshots__/${name}-${pass ? "pass" : "failure"}.snap.svg`,
      import.meta.url,
    ),
    svg,
  )
}
