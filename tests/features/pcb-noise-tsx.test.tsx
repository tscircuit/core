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
    algorithm: "lfsr_fibonacci",
    algorithm_version: "1",
    edge_time_convention: "10_90",
  })
  expect(configuration.baseline).toEqual({
    kind: "quiet_sources",
    source_names: ["a_source"],
    voltage_v: 0,
  })
  expect(configuration.observations).toEqual(
    ["a", "v"].flatMap((name) => [
      {
        name: `${name}_source_voltage`,
        port_name: `${name}_tx`,
        quantity: "voltage",
      },
      {
        name: `${name}_load_voltage`,
        port_name: `${name}_rx`,
        quantity: "voltage",
      },
      {
        name: `${name}_source_current`,
        port_name: `${name}_tx`,
        quantity: "current",
      },
      {
        name: `${name}_load_current`,
        port_name: `${name}_rx`,
        quantity: "current",
      },
    ]),
  )
  expect(configuration.terminations[1].model).toMatchObject({
    kind: "parallel_rc",
    capacitance_f: 1e-12,
  })
  expect(configuration.eyes?.[0].timing).toMatchObject({
    kind: "explicit_clock",
    clock: { kind: "authored_edges", source_name: "v_source" },
    edge: "rising",
    threshold_v: 0.5,
    ui_per_selected_edge: 1,
    sample_offset_s: 1e-9,
    interpretation: "nominal_reference",
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
