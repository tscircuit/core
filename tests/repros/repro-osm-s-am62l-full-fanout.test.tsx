import { expect, test } from "bun:test"
import { createAm62lOsmFullFanout } from "tests/fixtures/create-am62l-osm-full-fanout"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("OSM-S AM62L signal, ground, and power fanout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(createAm62lOsmFullFanout())
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()[0]?.message).toContain(
    "only 95 of 96 connections could escape",
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
