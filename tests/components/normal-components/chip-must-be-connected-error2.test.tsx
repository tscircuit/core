import { test, expect } from "bun:test"
import { getTestFixture } from "../../../tests/fixtures/get-test-fixture"
import { checkPinMustBeConnected } from "@tscircuit/checks"

test("chip pin with mustBeConnected connected via connections should not emit error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="dip8"
        pinAttributes={{
          pin1: { mustBeConnected: true },
        }}
        connections={{
          pin1: "net.GND",
        }}
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const errors = checkPinMustBeConnected(circuitJson)
  const gndErrors = errors.filter((e) => e.source_component_id.includes("U1"))

  expect(gndErrors.length).toBe(0)
})
