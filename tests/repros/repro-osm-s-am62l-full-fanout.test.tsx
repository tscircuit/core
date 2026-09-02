import { expect, test } from "bun:test"
import { createAm62lOsmFullFanout } from "tests/fixtures/create-am62l-osm-full-fanout"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("OSM-S AM62L signal, ground, and power fanout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(createAm62lOsmFullFanout())
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(96)
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
