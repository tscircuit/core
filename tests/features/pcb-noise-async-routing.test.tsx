import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NoiseBoard } from "tests/fixtures/pcb-noise-board"

test("noise physical resolution waits for asynchronous routing", async () => {
  const { circuit } = getTestFixture()
  const phases: string[] = []
  circuit.on("asyncEffect:start", ({ phase }) => phases.push(phase))
  circuit.add(<NoiseBoard straightSignal={false} />)
  await circuit.renderUntilSettled()
  expect(phases).toContain("PcbTraceRender")
  expect(
    circuit.db.simulation_pcb_noise_configuration.list()[0].ports,
  ).toHaveLength(4)
  expect(
    circuit.db.pcb_trace.list().filter((trace) => trace.route.length > 1)
      .length,
  ).toBeGreaterThanOrEqual(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 20_000)
