import { expect, test } from "bun:test"
import H616DdrBoard from "@tscircuit/core-ddr-benchmark/circuits/h616"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("H616 native timing constraints route the whole board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<H616DdrBoard />)
  await circuit.renderUntilSettled()
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
}, 120000)
