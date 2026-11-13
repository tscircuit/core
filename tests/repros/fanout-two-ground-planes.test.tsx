import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

async function routeGroundPads(fanoutPourNetMap?: {
  inner1?: string
  inner4?: string
}) {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  const failures: string[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) failures.push(String(event.error))
  })
  circuit.add(
    <board
      width={14}
      height={7}
      layers={6}
      schematicDisabled
      minTraceWidth={0.1}
      minViaHoleDiameter={0.2}
      minViaPadDiameter={0.5}
    >
      <autoroutingphase
        autorouter="fanout"
        fanoutPourNetMap={fanoutPourNetMap}
      />
      {(["top", "bottom"] as const).map((side, i) => (
        <chip
          key={side}
          name={i === 0 ? "U1" : "U2"}
          layer={side}
          pcbX={i === 0 ? -3 : 3}
          footprint={
            <footprint>
              <smtpad portHints={["pin1"]} shape="circle" radius={0.25} />
            </footprint>
          }
        />
      ))}
      <trace name="GND_TOP" from=".U1 > .pin1" to="net.GND" />
      <trace name="GND_BOTTOM" from=".U2 > .pin1" to="net.GND" />
      <copperpour connectsTo="net.GND" layer="inner1" unbroken />
      <copperpour connectsTo="net.GND" layer="inner4" unbroken />
      <pcbnotetext
        pcbY={2.4}
        text="GND planes on inner1 and inner4"
        fontSize={0.55}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return { circuit, failures, input: phases[0]?.startSimpleRouteJson }
}

test("fanout drops top and bottom ground pads onto a six-layer board with two GND planes", async () => {
  // Reverse stack order to catch accidentally choosing the first authored plane.
  const explicit = await routeGroundPads({
    inner4: "net.GND",
    inner1: "net.GND",
  })
  const inferred = await routeGroundPads()
  const override = await routeGroundPads({ inner1: "net.GND" })
  for (const result of [explicit, inferred, override]) {
    const { circuit, failures, input } = result
    const bottomTarget = result === override ? "inner1" : "inner4"
    expect(failures).toEqual([])
    expect(input?.buses).toHaveLength(2)
    expect(input?.buses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          busId: "GND_TOP",
          termination: { type: "plane", layer: "inner1" },
        }),
        expect.objectContaining({
          busId: "GND_BOTTOM",
          termination: { type: "plane", layer: bottomTarget },
        }),
      ]),
    )
    const vias = circuit.db.pcb_via.list()
    expect(vias).toHaveLength(2)
    expect(vias).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from_layer: "top", to_layer: "inner1" }),
        expect.objectContaining({
          from_layer: "bottom",
          to_layer: bottomTarget,
        }),
      ]),
    )
    for (const via of vias) {
      expect(via.layers).toEqual([
        "top",
        "inner1",
        "inner2",
        "inner3",
        "inner4",
        "bottom",
      ])
    }
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
  }
  const { circuit } = explicit
  const vias = circuit.db.pcb_via.list()
  for (const [side, x] of [
    ["top", -3],
    ["bottom", 3],
  ] as const) {
    const via = vias.find((v) => v.from_layer === side)
    circuit.db.pcb_note_text.insert({
      text: via ? `${side} to ${via.to_layer}` : `${side}: no GND via`,
      anchor_position: { x, y: -1.7 },
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.4,
      color: via ? "#81eed1" : "#ffae9e",
    })
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
