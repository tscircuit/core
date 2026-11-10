import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { DifferentialPairValidationBoard } from "tests/fixtures/differential-pair-validation-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects saved no terminal at the saved JSON boundary", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <DifferentialPairValidationBoard>
      <differentialpair
        name="USB"
        positiveConnection={["DP1", "DP2"]}
        negativeConnection={["DM1", "DM2"]}
        maxLengthSkew={0.1}
      />
    </DifferentialPairValidationBoard>,
  )
  circuit.render()
  const pair = circuit.db.source_bus.getWhere({ name: "USB" })!
  circuit.db.pcb_port.delete(circuit.db.pcb_port.list()[0]!.pcb_port_id)
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({ circuitJson: circuit.db.toArray() }),
  ).toThrow("routable terminals")
})
