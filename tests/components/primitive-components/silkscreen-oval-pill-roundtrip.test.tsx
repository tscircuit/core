import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated top and bottom silkscreen ovals and pills survive rendered subcircuit import", async () => {
  const { circuit: original } = getTestFixture({
    platform: { schematicDisabled: true },
  })
  original.add(
    <group subcircuit routingDisabled>
      {(["top", "bottom"] as const).map((layer, side) => (
        <chip
          key={layer}
          name={`U${side + 1}`}
          layer={layer}
          pcbX={side * 12 - 6}
          pcbRotation={90}
          footprint={
            <footprint>
              <silkscreenoval
                radiusX={3}
                radiusY={1}
                pcbY={-2}
                pcbRotation={25}
              />
              <silkscreenpill width={2} height={5} pcbY={3} pcbRotation={35} />
            </footprint>
          }
        />
      ))}
    </group>,
  )
  await original.renderUntilSettled()
  const input = JSON.parse(JSON.stringify(original.getCircuitJson()))
  const before = structuredClone(input)
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={28} height={18} routingDisabled schematicDisabled>
      <subcircuit name="S1" circuitJson={input} />
      <pcbnotetext
        text="Roundtrip: top / bottom, rotated 90deg"
        pcbY={7}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const [expected, actual] of [
    [
      original.db.pcb_silkscreen_oval.list(),
      circuit.db.pcb_silkscreen_oval.list(),
    ],
    [
      original.db.pcb_silkscreen_pill.list(),
      circuit.db.pcb_silkscreen_pill.list(),
    ],
  ] as const) {
    expect(actual).toHaveLength(2)
    for (const shape of actual) {
      const previous = expected.find(
        (candidate) => candidate.layer === shape.layer,
      )!
      expect(shape.center.x).toBeCloseTo(previous.center.x, 6)
      expect(shape.center.y).toBeCloseTo(previous.center.y, 6)
      // Both shapes are invariant under a half turn.
      const angleDelta =
        (shape.ccw_rotation ?? 0) - (previous.ccw_rotation ?? 0)
      expect(Math.sin((angleDelta * Math.PI) / 180)).toBeCloseTo(0, 6)
    }
  }
  expect(input).toEqual(before)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
