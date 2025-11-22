import { test, expect } from "bun:test"
import { getTestFixture } from "../../../tests/fixtures/get-test-fixture"
import { checkPinMustBeConnected } from "@tscircuit/checks"

test("chip pin with mustBeConnected attribute should emit error if floating", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="dip8"
        pinAttributes={{
          pin1: { mustBeConnected: true },
          pin2: { mustBeConnected: true },
        }}
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const sourcePorts = circuitJson.filter((el: any) => el.type === "source_port")
  const portsWithMustBeConnected = sourcePorts.filter(
    (p: any) => p.must_be_connected === true,
  )
  console.log(
    "Ports with must_be_connected === true:",
    portsWithMustBeConnected.length,
  )
  console.log(
    "First port details:",
    JSON.stringify(portsWithMustBeConnected[0], null, 2),
  )
  const errors = checkPinMustBeConnected(circuitJson)

  expect(errors.length).toBe(2)
  expect(errors[0].message).toContain("pin1")
  expect(errors[0].message).toContain("must be connected but is floating")
  expect(errors[0].source_component_id).toBeDefined()
  expect(errors[0].source_port_id).toBeDefined()
  expect(errors[1].message).toContain("pin2")
})
