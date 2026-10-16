import { expect, test } from "bun:test"
import { pcb_board } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { stackSvgsVertically } from "stack-svgs"
import boardData from "tests/fixtures/assets/sample024-board-via-policy.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Sample024 explicitly allows via-in-pad in Circuit JSON", async () => {
  // Unmodified pcb_board from dataset-srj24@004847d1,
  // circuit-json/sample024-pmp22650-main.json.
  const importedBoard = pcb_board.parse(boardData)
  expect(importedBoard.is_via_in_pad_allowed).toBe(true)

  // Illustrative exposed-pad footprint with local positions in mm:
  // +X right, +Y up, +Z toward the top layer (right-handed).
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="8mm"
      height="8mm"
      layers={8}
      isViaInPadAllowed={importedBoard.is_via_in_pad_allowed}
      allowBlindAndBuriedVias={importedBoard.allow_blind_and_buried_vias}
      routingDisabled
      schematicDisabled
    >
      <net name="GND" />
      <chip
        name="U1"
        pinLabels={{ pin17: ["GND"] }}
        connections={{ pin17: "net.GND" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin17"]}
              width="2.74mm"
              height="2.74mm"
              shape="rect"
            />
            <via
              pcbX={-0.5}
              pcbY={-0.5}
              outerDiameter="0.61mm"
              holeDiameter="0.30mm"
              fromLayer="top"
              toLayer="inner1"
            />
            <via
              pcbX={-0.5}
              pcbY={0.5}
              outerDiameter="0.61mm"
              holeDiameter="0.30mm"
              fromLayer="top"
              toLayer="inner1"
            />
            <via
              pcbX={0.5}
              pcbY={-0.5}
              outerDiameter="0.61mm"
              holeDiameter="0.30mm"
              fromLayer="top"
              toLayer="inner1"
            />
            <via
              pcbX={0.5}
              pcbY={0.5}
              outerDiameter="0.61mm"
              holeDiameter="0.30mm"
              fromLayer="top"
              toLayer="inner1"
            />
          </footprint>
        }
      />
      <pcbnotetext
        pcbY="2.8mm"
        fontSize="0.35mm"
        text="EXAMPLE: 2.74mm EXPOSED GND PAD"
      />
      <pcbnotetext
        pcbY="-2.8mm"
        fontSize="0.35mm"
        text="4 BLIND THERMAL VIAS: TOP TO INNER1"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const { simpleRouteJson: footprintSrj } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  })
  expect(footprintSrj.allowViaInPad).toBeUndefined()
  expect(circuit.db.pcb_via.list()).toHaveLength(4)
  for (const via of circuit.db.pcb_via.list()) {
    expect(via.layers).toEqual(["top", "inner1"])
  }

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: [importedBoard],
    ignoreExistingTopLevelPcbRouteState: true,
  })
  expect(simpleRouteJson.allowViaInPad).toBeUndefined()

  const snapshot = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="210" viewBox="0 0 900 210">
    <rect width="900" height="210" fill="#111827" />
    <g font-family="Arial, sans-serif" fill="#e5e7eb">
      <text x="28" y="38" font-size="23" font-weight="bold">PMP22650: via-in-pad policy conversion</text>
      <text x="28" y="68" font-size="15">The imported board allows vias in pads. Missing SRJ policy defaults to false.</text>
      <g font-size="16" fill="#9ca3af">
        <text x="28" y="110">Source policy</text>
        <text x="320" y="110">SRJ allowViaInPad</text>
        <text x="620" y="110">Router flag (?? false)</text>
      </g>
      <line x1="28" y1="126" x2="872" y2="126" stroke="#374151" />
      <g font-size="18">
        <text x="28" y="159">${importedBoard.is_via_in_pad_allowed}</text>
        <text x="320" y="159" fill="${simpleRouteJson.allowViaInPad === undefined ? "#fbbf24" : "#34d399"}">${simpleRouteJson.allowViaInPad ?? "not emitted"}</text>
        <text x="620" y="159">${simpleRouteJson.allowViaInPad ?? false}</text>
      </g>
      <text x="28" y="195" font-size="14" fill="#9ca3af">Source: dataset-srj24 / sample024 / pcb_board</text>
    </g>
  </svg>`

  const comparison = stackSvgsVertically(
    [
      convertCircuitJsonToPcbSvg(circuitJson, {
        width: 900,
        height: 460,
        layer: "top",
        backgroundColor: "#111827",
        includeVersion: false,
        shouldDrawRatsNest: false,
      }),
      snapshot,
    ],
    { gap: 16, normalizeSize: false },
  )
  await expect(comparison).toMatchSvgSnapshot(import.meta.path, undefined, {
    diffThresholdPercent: 0.01,
  })
})
