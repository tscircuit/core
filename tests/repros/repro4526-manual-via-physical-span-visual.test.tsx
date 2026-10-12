import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("snapshot manual vias missing bottom-layer pads with blind vias disabled", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(
    <board
      width={12}
      height={4}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias={false}
      pcbStyle={{ viaHoleDiameter: 0.3, viaPadDiameter: 0.7 }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace
        from="R1.pin2"
        to="R2.pin1"
        thickness={0.2}
        pcbPathRelativeTo="R1.pin2"
        pcbPath={[
          "R1.pin2",
          { x: 2, y: 0 },
          { x: 2, y: 0, via: true, fromLayer: "top", toLayer: "inner2" },
          { x: 2, y: 0 },
          { x: 6, y: 0 },
          { x: 6, y: 0, via: true, fromLayer: "inner2", toLayer: "top" },
          { x: 6, y: 0 },
          "R2.pin1",
        ]}
      />
      <pcbnotetext pcbX={-2} pcbY={1.1} fontSize={0.45} text="V1" />
      <pcbnotetext pcbX={2} pcbY={1.1} fontSize={0.45} text="V2" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const vias = circuit.db.pcb_via.list()
  const boardLayers = ["top", "inner1", "inner2", "bottom"] as const
  const throughVias = vias.filter((via) =>
    boardLayers.every((layer) => via.layers.includes(layer)),
  )
  const fullSpan = vias.length === 2 && throughVias.length === 2
  const bottomVias = vias.filter((via) => via.layers.includes("bottom"))
  const explanationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="144" viewBox="0 0 1800 144">
    <rect width="1800" height="144" fill="#141414" />
    <g font-family="sans-serif" text-anchor="middle">
      <text x="900" y="42" font-size="38" font-weight="bold" fill="${fullSpan ? "#4ade80" : "#fb7185"}">Manual via physical span: ${fullSpan ? "PASSING" : "FAILING"}</text>
      <text x="900" y="86" font-size="28" fill="#f4f4f4">Blind vias disabled: both vias must span top, inner1, inner2, and bottom.</text>
      <text x="900" y="126" font-size="28" fill="#f4f4f4">Actual: ${throughVias.length} of ${vias.length} vias span all four layers; ${bottomVias.length} reach bottom.</text>
    </g>
  </svg>`
  const circuitJson = circuit.getCircuitJson()
  const layerPanels = (["top", "bottom"] as const).map((layer) =>
    stackSvgsVertically(
      [
        `<svg xmlns="http://www.w3.org/2000/svg" width="892" height="48" viewBox="0 0 892 48">
          <rect width="892" height="48" fill="#141414" />
          <text x="446" y="34" font-family="sans-serif" font-size="30" fill="#f4f4f4" text-anchor="middle">${layer}: ${vias.filter((via) => via.layers.includes(layer)).length} via pads</text>
        </svg>`,
        convertCircuitJsonToPcbSvg(circuitJson, {
          layer,
          width: 892,
          height: 512,
        }),
      ],
      { gap: 0, normalizeSize: false },
    ),
  )
  const svg = stackSvgsVertically(
    [
      explanationSvg,
      stackSvgsHorizontally(layerPanels, { gap: 16, normalizeSize: false }),
    ],
    { gap: 16, normalizeSize: false },
  )
  await expect(svg).toMatchSvgSnapshot(
    import.meta.path,
    "repro4526-manual-via-physical-span",
    { diffThresholdPercent: 0 },
  )
})
