import { expect, test } from "bun:test"
import {
  convertCircuitJsonToPcbSvg,
  convertCircuitJsonToSchematicSvg,
} from "circuit-to-svg"
import { stackSvgsHorizontally } from "stack-svgs"
import "tests/fixtures/extend-expect-any-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton internally connected pins are marked on the PCB", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="9mm" height="11mm">
      <schematictext
        text="PUSHBUTTON INTERNALLY CONNECTED: 1-4 AND 2-3"
        fontSize={0.2}
        schY={2}
      />
      <pcbnotetext
        text="SW1: PINS 1-4 AND 2-3 INTERNALLY CONNECTED"
        fontSize={0.18}
        pcbY={5}
      />
      <pushbutton
        name="SW1"
        internallyConnectedPins={[
          ["pin1", "pin4"],
          ["pin2", "pin3"],
        ]}
        connections={{
          pin1: "net.LEFT",
          pin2: "net.RIGHT",
        }}
        footprint="pushbutton_id1.3mm_od2mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  expect(
    circuit.db.pcb_fabrication_note_text.list({
      text: "MARKED INTERNALLY CONNECTED",
    }),
  ).toHaveLength(2)

  const schematicAndPcbSvg = stackSvgsHorizontally(
    [
      convertCircuitJsonToSchematicSvg(circuitJson, {
        grid: { cellSize: 1, labelCells: true },
      }),
      convertCircuitJsonToPcbSvg(circuitJson),
    ],
    {
      gap: 24,
      normalizeSize: false,
      rootAttributes: {
        "data-testid": "pushbutton-internally-connected-schematic-pcb",
      },
    },
  )

  expect(schematicAndPcbSvg).toMatchSvgSnapshot(
    import.meta.path,
    "pushbutton-internally-connected-schematic-pcb",
  )
})
