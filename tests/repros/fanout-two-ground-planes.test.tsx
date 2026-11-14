import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fanout drops top and bottom ground pads onto a six-layer board with two GND planes", async () => {
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
        fanoutPourNetMap={{ inner4: "net.GND", inner1: "net.GND" }}
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
  const vias = circuit.db.pcb_via.list()
  expect(failures).toHaveLength(1)
  expect(failures[0]).toContain(
    'Fanout plane net "GND" maps to multiple layers',
  )
  expect(phases).toHaveLength(0)
  expect(vias).toHaveLength(0)
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
