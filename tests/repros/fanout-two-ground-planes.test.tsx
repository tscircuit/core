import { beforeAll, expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A ground-fanout detail from a typical six-layer controller power section:
// QFN ground pins and a top decoupler, plus two backside decouplers.
const { circuit } = getTestFixture()
const phases = createAutoroutingPhaseIoStack(circuit)
const routingFailures: string[] = []

beforeAll(async () => {
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) routingFailures.push(String(event.error))
  })
  circuit.add(
    <board
      width={18}
      height={12}
      layers={6}
      schematicDisabled
      minTraceWidth={0.1}
      minViaHoleDiameter={0.2}
      minViaPadDiameter={0.45}
      minTraceToPadEdgeClearance={0.1}
      minViaEdgeToPadEdgeClearance={0.1}
    >
      <autoroutingphase
        autorouter="fanout"
        fanoutPourNetMap={{ inner4: "net.GND", inner1: "net.GND" }}
      />
      <net name="GND" isGroundNet />
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
        footprint="qfn16_w4_h4_p0.65mm_pw0.3_pl0.6"
        pinLabels={{ pin4: "GND", pin12: "GND" }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={-4} />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        layer="bottom"
      />
      <capacitor
        name="C3"
        capacitance="1uF"
        footprint="0603"
        pcbX={4}
        layer="bottom"
      />
      <trace name="U1_GND4" from=".U1 > .pin4" to="net.GND" />
      <trace name="U1_GND12" from=".U1 > .pin12" to="net.GND" />
      <trace name="C1_GND" from=".C1 > .pin2" to="net.GND" />
      <trace name="C2_GND" from=".C2 > .pin2" to="net.GND" />
      <trace name="C3_GND" from=".C3 > .pin2" to="net.GND" />
      <copperpour
        connectsTo="net.GND"
        layer="inner1"
        unbroken
        useThermalReliefs={false}
      />
      <copperpour
        connectsTo="net.GND"
        layer="inner4"
        unbroken
        useThermalReliefs={false}
      />
      <pcbnotetext
        pcbY={4.5}
        text="Six-layer controller: GND fanout detail"
        fontSize={0.55}
      />
      <pcbnotetext
        pcbY={3.5}
        text="Top / GND / signal / signal / GND / bottom"
        fontSize={0.4}
      />
      <pcbnotetext pcbX={-4} pcbY={-1.5} text="C1 top" fontSize={0.35} />
      <pcbnotetext pcbY={-2.3} text="C2 backside decoupling" fontSize={0.35} />
      <pcbnotetext pcbX={4} pcbY={-1.5} text="C3 bottom" fontSize={0.35} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const vias = circuit.db.pcb_via.list()
  const topVias = vias.filter((via) => via.from_layer === "top")
  const bottomVias = vias.filter((via) => via.from_layer === "bottom")
  circuit.db.pcb_note_text.insert({
    text: `Top: ${topVias.length}/3 GND drops to inner1`,
    anchor_position: { x: 0, y: -3.5 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.45,
  })
  circuit.db.pcb_note_text.insert({
    text: `Bottom: ${bottomVias.length}/2 GND drops to inner4`,
    anchor_position: { x: 0, y: -4.5 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.45,
  })
  // Snapshot and placement failures must not be swallowed by test.failing.
  expect(circuit.db.pcb_pad_pad_clearance_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: false,
    showPinNumbers: true,
  })
})

test.failing(
  "fanout connects a controller and double-sided decouplers to their nearest GND planes",
  () => {
    const vias = circuit.db.pcb_via.list()
    const topVias = vias.filter((via) => via.from_layer === "top")
    const bottomVias = vias.filter((via) => via.from_layer === "bottom")
    expect(routingFailures).toEqual([])
    expect(phases[0]?.startSimpleRouteJson?.buses).toEqual([
      expect.objectContaining({
        busId: "U1_GND4",
        termination: { type: "plane", layer: "inner1" },
      }),
      expect.objectContaining({
        busId: "U1_GND12",
        termination: { type: "plane", layer: "inner1" },
      }),
      expect.objectContaining({
        busId: "C1_GND",
        termination: { type: "plane", layer: "inner1" },
      }),
      expect.objectContaining({
        busId: "C2_GND",
        termination: { type: "plane", layer: "inner4" },
      }),
      expect.objectContaining({
        busId: "C3_GND",
        termination: { type: "plane", layer: "inner4" },
      }),
    ])
    expect(topVias.map((via) => via.to_layer)).toEqual([
      "inner1",
      "inner1",
      "inner1",
    ])
    expect(bottomVias.map((via) => via.to_layer)).toEqual(["inner4", "inner4"])
    expect(
      circuit.db.pcb_copper_pour
        .list()
        .map((pour) => pour.layer)
        .sort(),
    ).toEqual(["inner1", "inner4"])
    expect(
      circuit
        .getCircuitJson()
        .filter((element) => element.type.endsWith("_error")),
    ).toEqual([])
  },
)
