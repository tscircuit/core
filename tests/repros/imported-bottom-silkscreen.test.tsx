import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import { unrouteCircuitJson } from "lib/utils/autorouting/unrouteCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("KiCad subcircuit preserves bottom silkscreen layer and rotation", async () => {
  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "example-resistors.kicad_pcb",
    readFileSync(
      new URL("./assets/example-resistors.kicad_pcb", import.meta.url),
      "utf8",
    ),
  )
  converter.runUntilFinished()
  const boardContent = converter
    .getOutput()
    .filter((elm) => elm.type !== "pcb_board")
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={11} height={8} routingDisabled schematicDisabled>
      <subcircuit circuitJson={unrouteCircuitJson(boardContent)} />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    camPos: [11, 19, 8],
    diffTolerance: 0.0001,
    snapshotSuffix: "top",
  })
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    camPos: [11, -19, 8],
    diffTolerance: 0.0001,
    snapshotSuffix: "bottom",
  })

  // Native KiCad: R2 is on B.SilkS, mirrored, with a 0 degree draw rotation.
  expect(circuit.db.pcb_silkscreen_text.getWhere({ text: "R2" })).toMatchObject(
    {
      layer: "bottom",
      ccw_rotation: 0,
    },
  )
})
