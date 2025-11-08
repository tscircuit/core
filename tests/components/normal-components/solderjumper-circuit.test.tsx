import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import { it, expect } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a jumper with pinrow4 footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board 
      width="20mm"
      height="15mm"
      grid
      gridGap="1mm"
      schMaxTraceDistance={5}
    >
      <resistor name="R1" footprint={"0402"} resistance={"4k"} />
      <resistor name="R2" pcbX={3} footprint={"0402"} resistance={"4k"} />
      <resistor name="R3" pcbY={3} footprint={"0402"} resistance={"4k"} />
      <solderjumper
        name="J1"
        footprint="solderjumper3_bridged12"
        pinCount={3}
        bridgedPins={[["pin1", "2"]]} // Test with "pin1" and "2"
        pcbX={-4}
        pcbY={-4}
        schX={-2}
        schY={-2}
      />
      <trace from={".R2 > .pin1"} to={".R3 > .pin2"} />
      <trace from={".R2 > .pin2"} to={".R3 > .pin1"} />
      <trace from={".J1 > .pin1"} to={".R1 > .pin1"} />
      <trace from={".J1 > .pin3"} to={".R1 > .pin2"} />
    </board>,
  )

  circuit.render()
  const errors = checkEachPcbTraceNonOverlapping(circuit.getCircuitJson())
  expect(errors).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
