import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a via between top and inner1 adds only the stackup distance between them", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="12mm"
      height="10mm"
      layers={4}
      thickness="1.6mm"
      fabricatorPreset="jlcpcb_standard"
      allowBlindAndBuriedVias
    >
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
        pcbX={3}
        pcbY={-1}
      />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        maxLength="6mm"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={[
          { x: 1.5, y: 0, via: true, fromLayer: "top", toLayer: "inner1" },
          { x: 3.5, y: 0, via: true, fromLayer: "inner1", toLayer: "top" },
        ]}
      />

      <pcbnotetext
        pcbY={4}
        text="VIA LENGTH IS THE STACKUP DISTANCE"
        fontSize="0.45mm"
      />
      <pcbnotetext
        pcbY={3.2}
        text="TOP TO INNER1 = 0.035 + 0.0994 + 0.0152 / 2 = 0.142 mm"
        fontSize="0.3mm"
      />
      <pcbnotetext
        pcbY={2.5}
        text="ROUTE = 4.98 + 2 x 0.142 = 5.26 mm, UNDER THE 6 mm LIMIT"
        fontSize="0.3mm"
      />
      <pcbnotetext pcbX={-1.5} pcbY={0} text="VIA" fontSize="0.35mm" />
      <pcbnotetext pcbX={1.5} pcbY={0} text="VIA" fontSize="0.35mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()[0].trace_length).toBeCloseTo(5.264, 3)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
