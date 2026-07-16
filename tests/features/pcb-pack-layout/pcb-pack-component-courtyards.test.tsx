import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPack respects component courtyards", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" pcbPack pcbGap="0mm" routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="NE555DR"
        footprint="soic8"
        pinLabels={{ pin1: "GND", pin2: "TRIG" }}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: "U1.pin2" }}
      />
    </board>,
  )

  circuit.render()

  const courtyardOverlapErrors = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_courtyard_overlap_error")

  expect(courtyardOverlapErrors).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
