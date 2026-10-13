import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved blind via spans are preserved and reported when disabled", async () => {
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
  const pcbTrace = circuit.db.pcb_trace.list()[0]!
  const pcbTraceErrors = circuit.db.pcb_trace_error.list()
  const expectedPathEntryIndices = [2, 5]

  // The board policy must report the saved blind vias, preserving each
  // barrel's original span instead of expanding it to reach the bottom layer.
  expect(vias.map((via) => via.layers)).toEqual([
    ["top", "inner1", "inner2"],
    ["inner2", "inner1", "top"],
  ])
  expect(pcbTraceErrors).toEqual([
    expect.objectContaining({
      pcb_trace_id: pcbTrace.pcb_trace_id,
      source_trace_id: pcbTrace.source_trace_id,
      center: { x: vias[0]!.x, y: vias[0]!.y },
      is_fatal: false,
      message: expect.stringContaining(
        "Disallowed vias in pcbPath (R1.pin2 to R2.pin1): 2 disallowed vias",
      ),
    }),
  ])
  const message = pcbTraceErrors[0]!.message
  for (const [viaIndex, via] of vias.entries()) {
    expect(message).toContain(
      `pcbPath[${expectedPathEntryIndices[viaIndex]}]: blind via ` +
        `(fromLayer: "${via.from_layer}", toLayer: "${via.to_layer}") ` +
        `spanning [${via.layers.join(", ")}]`,
    )
  }
  expect(message).toContain('fromLayer: "top", toLayer: "bottom"')
  expect(message).toContain("allowBlindAndBuriedVias={true}")
  const bottomVias = vias.filter((via) => via.layers.includes("bottom"))
  const explanationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="144" viewBox="0 0 1800 144">
    <rect width="1800" height="144" fill="#141414" />
    <g font-family="sans-serif" text-anchor="middle">
      <text x="900" y="42" font-size="38" font-weight="bold" fill="#4ade80">Manual via policy: PASSING</text>
      <text x="900" y="86" font-size="28" fill="#f4f4f4">Saved blind-via spans are preserved; one nonfatal error lists all disallowed vias in the path.</text>
      <text x="900" y="126" font-size="28" fill="#f4f4f4">Policy errors: ${pcbTraceErrors.length}; saved vias: ${vias.length}; vias reaching bottom: ${bottomVias.length}.</text>
    </g>
  </svg>`
  // The SVG renderer prioritizes connected ports over an error's center.
  // Keep connection endpoints and path indices in short callouts at the first
  // disallowed via using a rendering copy;
  // the assertions above verify the original full diagnostic messages.
  const connection = circuit.db.source_trace
    .get(pcbTrace.source_trace_id!)!
    .display_name!.replace(" to ", " → ")
  const circuitJsonForSnapshot = circuit.getCircuitJson().map((element) => {
    if (element.type !== "pcb_trace_error") {
      return element
    }
    const pathDescription = element.message.split(" (")[0]
    return {
      ...element,
      pcb_port_ids: [],
      message: `${pathDescription} (${connection}): fix vias at indices ${expectedPathEntryIndices.join(" and ")}`,
    }
  })
  const layerPanels = (["top", "bottom"] as const).map((layer) =>
    stackSvgsVertically(
      [
        `<svg xmlns="http://www.w3.org/2000/svg" width="892" height="48" viewBox="0 0 892 48">
          <rect width="892" height="48" fill="#141414" />
          <text x="446" y="34" font-family="sans-serif" font-size="30" fill="#f4f4f4" text-anchor="middle">${layer}: ${vias.filter((via) => via.layers.includes(layer)).length} via pads</text>
        </svg>`,
        convertCircuitJsonToPcbSvg(circuitJsonForSnapshot, {
          layer,
          width: 892,
          height: 512,
          shouldDrawErrors: true,
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
