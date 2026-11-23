import { beforeAll, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const converter = new KicadToCircuitJsonConverter()
converter.addFile(
  "arduino-uno.source.kicad_pcb",
  readFileSync(
    new URL("./assets/arduino-uno.source.kicad_pcb", import.meta.url),
    "utf8",
  ),
)
converter.runUntilFinished()
const { circuit } = getTestFixture()

beforeAll(async () => {
  circuit.add(
    <board schematicDisabled routingDisabled>
      <subcircuit circuitJson={converter.getOutput()} />
      <pcbnotetext
        text="Arduino Uno: Y2 stays horizontal; U4 and U5 stay vertical"
        pcbY={-30}
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const frontSilkscreen = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        element.type === "pcb_board" ||
        element.type === "pcb_note_text" ||
        (element.type.startsWith("pcb_silkscreen_") &&
          "layer" in element &&
          element.layer === "top"),
    )
  await expect(frontSilkscreen).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 960,
    viewport: { minX: -40, maxX: 40, minY: -33, maxY: 31 },
  })
}, 30_000)

test.failing("Arduino Uno retains native KiCad front-silkscreen angles", () => {
  expect(
    circuit.db.pcb_silkscreen_text
      .list()
      .filter((text) => text.layer === "top")
      .map(({ text, ccw_rotation }) => ({
        text,
        ccw_rotation: (((ccw_rotation ?? 0) % 360) + 360) % 360,
      })),
  ).toEqual([
    { text: "Y2", ccw_rotation: 0 },
    { text: "C1", ccw_rotation: 0 },
    { text: "U4", ccw_rotation: 90 },
    { text: "J8", ccw_rotation: 270 },
    { text: "U2", ccw_rotation: 90 },
    { text: "S1", ccw_rotation: 0 },
    { text: "U5", ccw_rotation: 90 },
    { text: "U1", ccw_rotation: 90 },
    { text: "J2", ccw_rotation: 90 },
    { text: "J9", ccw_rotation: 0 },
    { text: "F2", ccw_rotation: 90 },
    { text: "C2", ccw_rotation: 0 },
    { text: "Q1", ccw_rotation: 90 },
  ])
})
