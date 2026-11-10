import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Board from "tests/fixtures/am3352-ram-bus-lanes"

test("rejects AM3352 DQS pair ownership overlapping ordinary byte buses before routing", () => {
  const { circuit } = getTestFixture()
  circuit.add(<Board />)
  expect(() => circuit.render()).toThrow(
    'Bus "DDR_BYTE0" overlaps differential pair "DDR_DQS_PAIR0"',
  )
})
