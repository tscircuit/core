import { expect, test } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import IcePi from "tests/fixtures/icepi/board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("iCEPi full-board connectivity does not need linear network scans", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<IcePi geometryOnly />)
  await circuit.renderUntilSettled()

  const has = Set.prototype.has
  let membershipChecks = 0
  Set.prototype.has = function (member) {
    membershipChecks++
    return has.call(this, member)
  }
  try {
    getFullConnectivityMapFromCircuitJson(circuit.getCircuitJson())
  } finally {
    Set.prototype.has = has
  }

  circuit.db.pcb_note_text.insert({
    text: `Full connectivity map: ${membershipChecks.toLocaleString("en-US")} Set.has calls`,
    anchor_position: { x: 0, y: 32 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 1,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1500,
    height: 1100,
    showPcbNotes: true,
    backgroundColor: "white",
    showSolderMask: false,
    showDebugObjects: false,
    shouldDrawRatsNest: false,
    viewport: { minX: -45, maxX: 45, minY: -30, maxY: 35 },
  })
})
