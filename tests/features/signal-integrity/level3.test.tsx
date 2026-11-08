import { expect } from "bun:test"
import Board from "./fixtures/level3-three-signals"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("RFC Level 3 emits three independent runs with stable traffic and quiet victims", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(<Board />)
  await circuit.renderUntilSettled()
  const blocks = circuit.db.simulation_signal_integrity
    .list()
    .sort((a, b) => a.name!.localeCompare(b.name!))
  expect(blocks.map((block) => block.name)).toEqual([
    "TRAFFIC",
    "XTALK_HIGH",
    "XTALK_LOW",
  ])
  const signals = blocks.map((block) =>
    circuit.db.simulation_signal.list({
      simulation_signal_integrity_id: block.simulation_signal_integrity_id,
    }),
  )
  expect(signals.map((run) => run.length)).toEqual([3, 3, 3])
  expect(signals.map((run) => run[1].quiet)).toEqual([undefined, "high", "low"])
  expect(signals[0].map((signal) => signal.seed)).toEqual(
    signals[2].map((signal) => signal.seed),
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
