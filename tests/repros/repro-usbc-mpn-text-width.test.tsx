import { expect, test } from "bun:test"
import type { SchematicRect } from "circuit-json"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Schematic-only reproduction of pixalynx/usbc-led-switch v0.0.1:
// https://tscircuit.com/pixalynx/usbc-led-switch#files
// Preserve all schematic placements, pin arrangements, connections and names.
// PCB footprints, paths and CAD models are omitted.
//
// The old fixed character-width estimate reserved 4.92 mm for J1's MPN,
// pushing its GND rail across R1's CC1 trace twice. Proportional text bounds
// should leave enough room for GND before R1's CC1 trace.
test("USB-C MPN text bounds leave room for GND before CC1", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  const manufacturerPartNumber = "USB-C 16P SMD receptacle (DX07B024 style)"
  circuit.add(
    <board routingDisabled>
      <connector
        name="J1"
        manufacturerPartNumber={manufacturerPartNumber}
        schX={-4}
        schY={0}
        schWidth={2}
        pinLabels={{
          pin1: ["GND1"],
          pin2: ["VBUS1"],
          pin3: ["CC1"],
          pin4: ["CC2"],
          pin5: ["VBUS2"],
          pin6: ["GND2"],
          pin7: ["SHELL1"],
          pin8: ["SHELL2"],
          pin9: ["SHELL3"],
          pin10: ["SHELL4"],
        }}
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["VBUS1", "VBUS2", "CC1", "CC2", "GND1", "GND2"],
          },
          leftSide: {
            direction: "top-to-bottom",
            pins: ["SHELL1", "SHELL2", "SHELL3", "SHELL4"],
          },
        }}
        connections={{
          GND1: "net.GND",
          GND2: "net.GND",
          SHELL1: "net.GND",
          SHELL2: "net.GND",
          SHELL3: "net.GND",
          SHELL4: "net.GND",
        }}
        noConnect={["VBUS2"]}
      />
      <resistor
        name="R1"
        resistance="5.1k"
        schX={0}
        schY={-1.6}
        schRotation={-90}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="5.1k"
        schX={1.4}
        schY={-1.6}
        schRotation={-90}
        connections={{ pin2: "net.GND" }}
      />
      <switch
        name="SW1"
        type="spst"
        pinLabels={{ pin1: ["A"], pin2: ["B"] }}
        manufacturerPartNumber="LG-15F (Adafruit 3870)"
        schX={0.6}
        schY={1.2}
      />
      <resistor name="R3" resistance="100" schX={2.8} schY={1.2} />
      <led
        name="LED1"
        color="white"
        schX={4.6}
        schY={0}
        schRotation={-90}
        connections={{ pin2: "net.GND" }}
      />
      <trace name="CC1" from=".J1 > .CC1" to=".R1 > .pin1" />
      <trace name="CC2" from=".J1 > .CC2" to=".R2 > .pin1" />
      <trace name="VBUS" from=".J1 > .VBUS1" to=".SW1 > .pin1" />
      <trace name="SW_OUT" from=".SW1 > .pin2" to=".R3 > .pin1" />
      <trace name="LED_A" from=".R3 > .pin2" to=".LED1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group,
  )
  const mpnTextBox = inputProblem.textBoxes!.find(
    (textBox) => textBox.text === manufacturerPartNumber,
  )!

  const groundNet = circuit.db.source_net.getWhere({ name: "GND" })!
  const groundSourceTrace = circuit.db.source_trace
    .list()
    .find((trace) =>
      trace.connected_source_net_ids.includes(groundNet.source_net_id),
    )!
  const groundCrossings = circuit.db.schematic_trace
    .list()
    .filter(
      (trace) =>
        trace.subcircuit_connectivity_map_key ===
        groundSourceTrace.subcircuit_connectivity_map_key,
    )
    .flatMap((trace) => trace.edges.filter((edge) => edge.is_crossing))

  expect(groundCrossings).toHaveLength(0)
  // J1's MPN is left-anchored at the connector's left edge.
  expect(mpnTextBox.center.x - mpnTextBox.width / 2).toBeCloseTo(-5)
  expect(mpnTextBox).toMatchObject({
    textPlacement: {
      position: { x: -5, y: -0.83 },
      anchor: "left",
      fontSize: 0.18,
      rotation: 0,
    },
  })

  // Overlay the actual Core-generated routing obstacle after rendering. The
  // original text retains its original font size, position and left anchor.
  // Coordinates are schematic world mm (+X right, +Y up); center is a point.
  const mpnObstacle: SchematicRect = {
    type: "schematic_rect",
    schematic_rect_id: "mpn_routing_obstacle",
    center: mpnTextBox.center,
    width: mpnTextBox.width,
    height: mpnTextBox.height,
    rotation: 0,
    color: "red",
    is_filled: false,
    is_dashed: true,
    stroke_width: 0.015,
  }
  await expect([
    ...circuit.getCircuitJson(),
    mpnObstacle,
    {
      type: "schematic_text",
      schematic_text_id: "repro_explanation",
      text: `Red box: Core MPN obstacle (${mpnTextBox.width.toFixed(2)} mm). GND fits before CC1.`,
      position: { x: 0, y: 2.2 },
      anchor: "center",
      rotation: 0,
      font_size: 0.18,
      color: "red",
    },
  ]).toMatchSchematicSnapshot(import.meta.path, { grid: false })
})
