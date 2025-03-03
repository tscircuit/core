import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("complex chip schematic with multiple connections", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="40mm"
      height="40mm"
      schTraceAutoLabelEnabled
      autorouter="sequential-trace"
    >
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
        schPinArrangement={{
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
      <resistor name="R1" resistance="10k" schX={-4} schY={-3} />
      <resistor name="R2" resistance="10k" schX={-4} schY={-2} />
      <resistor name="R3" resistance="10k" schX={-4} schY={-1} />
      <resistor name="R4" resistance="10k" schX={-4} schY={0} />
      <resistor name="R5" resistance="10k" schX={-4} schY={1} />
      <resistor name="R6" resistance="10k" schX={-4} schY={2} />

      {/* Right side resistors */}
      <resistor name="R7" resistance="10k" schX={4} schY={-3} />
      <resistor name="R8" resistance="10k" schX={4} schY={-2} />
      <resistor name="R9" resistance="10k" schX={4} schY={-1} />
      <resistor name="R10" resistance="10k" schX={4} schY={0} />
      <resistor name="R11" resistance="10k" schX={4} schY={1} />
      <resistor name="R12" resistance="10k" schX={4} schY={2} />

      {/* Random connections */}
      <trace from=".R1 > .pin2" to=".U1 > .IN1" />
      <trace from=".R2 > .pin2" to=".U1 > .IN3" />
      <trace from=".R3 > .pin2" to=".U1 > .IN4" />
      <trace from=".R4 > .pin2" to=".U1 > .IN6" />
      <trace from=".R5 > .pin2" to=".U1 > .IN7" />
      <trace from=".R6 > .pin2" to=".U1 > .IN8" />

      <trace from=".R7 > .pin1" to=".U1 > .OUT8" />
      <trace from=".R8 > .pin1" to=".U1 > .OUT6" />
      <trace from=".R9 > .pin1" to=".U1 > .OUT5" />
      <trace from=".R10 > .pin1" to=".U1 > .OUT4" />
      <trace from=".R11 > .pin1" to=".U1 > .OUT2" />
      <trace from=".R12 > .pin1" to=".U1 > .OUT1" />

      {/* Cross connections for complexity */}
      <trace from=".R1 > .pin1" to=".R12 > .pin2" />
      <trace from=".R3 > .pin1" to=".R10 > .pin2" />
      <trace from=".R5 > .pin1" to=".R8 > .pin2" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
