import { expect, test } from "bun:test"
import { simulation_pcb_noise_configuration } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NoiseBoard } from "tests/fixtures/pcb-noise-board"

test("TSX emits pending physical noise with shared references and normalized SI inputs", async () => {
  const { circuit: pending } = getTestFixture()
  pending.add(<NoiseBoard />)
  await pending.renderUntilSettled()
  const [configuration] = pending.db.simulation_pcb_noise_configuration.list()
  expect(simulation_pcb_noise_configuration.parse(configuration)).toEqual(
    configuration,
  )
  expect(configuration.duration_s).toBeCloseTo(512e-9, 16)
  expect(configuration.sample_interval_s).toBeCloseTo(20e-12, 16)
  expect(configuration.ports).toHaveLength(4)
  expect(configuration.ports[0].reference_contact).toEqual(
    configuration.ports[2].reference_contact,
  )
  expect(configuration.sources[0].waveform).toMatchObject({
    kind: "prbs",
    baud_rate_hz: 500e6,
    rise_time_s: 200e-12,
  })
  expect(configuration.terminations[1].model).toMatchObject({
    kind: "parallel_rc",
    capacitance_f: 1e-12,
  })
  expect(configuration.eyes?.[0].timing).toMatchObject({
    kind: "known_ui",
    unit_interval_s: 2e-9,
    origin: { kind: "authored_epoch", epoch_s: 0 },
  })
  expect(pending.db.simulation_experiment.list()[0].experiment_type).toBe(
    "pcb_noise",
  )
  expect(
    pending
      .getCircuitJson()
      .filter(
        (record) =>
          record.type.startsWith("simulation_") &&
          record.type.includes("result"),
      ),
  ).toHaveLength(0)
  await expect(pending).toMatchPcbSnapshot(import.meta.path)
})
