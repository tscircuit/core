import { expect, test } from "bun:test"
import H616DdrBoard from "@tscircuit/core-ddr-benchmark/circuits/h616"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("H616 native timing constraints reproduce the failed bus route", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<H616DdrBoard />)
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list().length).toMatchInlineSnapshot(
    `1`,
  )
}, 120000)
