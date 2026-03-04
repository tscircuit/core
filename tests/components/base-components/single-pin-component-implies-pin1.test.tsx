import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("single-pin implicit pin1 renders expected schematic svg", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint name="TP1" footprintVariant="pad" />
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "SIG",
          pin3: "GND",
          pin4: "NC1",
          pin5: "NC2",
          pin6: "NC3",
          pin7: "NC4",
          pin8: "NC5",
        }}
      />
      <trace from="TP1" to="U1.pin2" />
    </board>,
  )

  circuit.render()

  const errors = circuit
    .getCircuitJson()
    .filter((c: any) => c.type === "source_trace_not_connected_error")
  expect(errors).toHaveLength(0)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
