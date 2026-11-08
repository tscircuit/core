import { expect } from "bun:test"
import Board from "./fixtures/level2-two-signals"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("RFC Level 2 emits two signals in one coupled block with distinct seeds", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(<Board />)
  await circuit.renderUntilSettled()
  const signals = circuit.db.simulation_signal.list()
  expect(signals.map((signal) => signal.name)).toEqual(["D0", "D1"])
  expect(
    new Set(signals.map((signal) => signal.simulation_signal_integrity_id))
      .size,
  ).toBe(1)
  expect(new Set(signals.map((signal) => signal.seed)).size).toBe(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
