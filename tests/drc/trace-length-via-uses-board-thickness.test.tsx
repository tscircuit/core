import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a via on a 0.8 mm board adds 0.8 mm to the trace length", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm" thickness="0.8mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={-1}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        layer="bottom"
        pcbX={3}
        pcbY={-1}
        pcbRotation={180}
      />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        maxLength="6mm"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={[
          {
            x: 3,
            y: 0,
            via: true,
            fromLayer: "top",
            toLayer: "bottom",
          },
        ]}
      />

      <pcbnotetext
        pcbY={4}
        text="VIA LENGTH IS THE 0.8 mm BOARD THICKNESS"
        fontSize="0.45mm"
      />
      <pcbnotetext
        pcbY={3.2}
        text="ROUTE = 2.49 + 0.80 + 2.49 = 5.78 mm"
        fontSize="0.38mm"
      />
      <pcbnotetext
        pcbY={2.5}
        text="6 mm LIMIT PASSES (1.6 mm PER VIA WOULD FAIL)"
        fontSize="0.38mm"
      />
      <pcbnotetext pcbY={0} text="VIA" fontSize="0.35mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()[0].trace_length).toBeCloseTo(5.78, 2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
