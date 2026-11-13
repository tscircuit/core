import { expect } from "bun:test"
import Board from "./fixtures/level4-ddr3-write"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("RFC DDR3 write example renders to the documented AM335x package-model error", async () => {
  // The unsupported package is diagnosed before extraction; skip costly routing.
  const { circuit } = getSiTestFixture({
    platform: { routingDisabled: true },
  })
  circuit.add(<Board />)
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    ".CPU: coupled [Package Model] not implemented yet; scalar fallback is forbidden.",
  )
  expect(circuit.db.simulation_ibis_model.list()).toHaveLength(2)
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
}, 60000)
