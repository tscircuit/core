import { expect, test } from "bun:test"
import { pcb_board } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
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

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 900,
    height: 460,
    layer: "top",
    backgroundColor: "#111827",
    includeVersion: false,
    shouldDrawRatsNest: false,
  })
})
