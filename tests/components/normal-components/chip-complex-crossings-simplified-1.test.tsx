import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("complex chip schematic with multiple connections", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      {/* Central chip with 16 pins */}
      <chip
        name="U1"
        schX={0}
        schY={0}
        footprint="soic16"
        pinLabels={{
          pin1: "IN1",
          pin2: "IN2",
          pin3: "IN3",
          pin4: "IN4",
          pin5: "IN5",
          pin6: "IN6",
          pin7: "IN7",
          pin8: "IN8",
          pin9: "OUT1",
          pin10: "OUT2",
          pin11: "OUT3",
          pin12: "OUT4",
          pin13: "OUT5",
          pin14: "OUT6",
          pin15: "OUT7",
          pin16: "OUT8",
        }}
        schPortArrangement={{
          leftSide: {
            pins: [1, 2, 3, 4, 5, 6, 7, 8],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [16, 15, 14, 13, 12, 11, 10, 9],
            direction: "top-to-bottom",
          },
        }}
      />

      {/* Left side resistors */}
      <resistor name="R2" resistance="10k" schX={-4} schY={-2} />
      <resistor name="R3" resistance="10k" schX={-4} schY={-1} />
      <resistor name="R4" resistance="10k" schX={-4} schY={0} />

      {/* Random connections */}
      <trace from=".R2 > .pin2" to=".U1 > .IN3" />
      {/* <trace from=".R3 > .pin2" to=".U1 > .IN4" />
      <trace from=".R4 > .pin2" to=".U1 > .IN6" /> */}
    </board>,
  )

  circuit.render()

  const traces = circuit.db.schematic_trace.list()

  // console.table(
  //   traces.flatMap((t) =>
  //     t.edges.map((te, ei) => ({
  //       schematic_trace_id: t.schematic_trace_id,
  //       ei,
  //       x: te.is_crossing ? "X" : "",
  //       from_x: te.from.x.toFixed(2),
  //       from_y: te.from.y.toFixed(2),
  //       to_x: te.to.x.toFixed(2),
  //       to_y: te.to.y.toFixed(2),
  //     })),
  //   ),
  // )

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
