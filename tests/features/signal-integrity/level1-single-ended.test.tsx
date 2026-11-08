import type { Port } from "lib/components/primitive-components/Port"
import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import Board from "./fixtures/level1-single-ended"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("RFC Level 1 single-ended resolves physical pins and emits SI defaults", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(<Board />)
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_signal_integrity.list()).toEqual([
    {
      type: "simulation_signal_integrity",
      simulation_signal_integrity_id: "simulation_signal_integrity_0",
      name: undefined,
      bit_rate_bps: 20e6,
      duration_s: 143 / 20e6,
      corner: "typ",
      unlisted_nets: "passive",
      unrouted: "error",
      pdn: "extracted",
      supply: "board",
    },
  ])
  const signal = circuit.db.simulation_signal.list()[0]
  expect(signal).toMatchObject({
    name: "DATA",
    driver: {
      kind: "single",
      source_port_id: circuit.selectOne<Port>(".TX > .Y")!.source_port_id,
    },
    receivers: [
      {
        kind: "single",
        source_port_id: circuit.selectOne<Port>(".RX > .A")!.source_port_id,
      },
    ],
    pattern: "prbs7",
    seed: 3288857317,
    offset_s: 0,
    probe: "local",
    mask: "ibis",
  })
  for (const record of [
    ...circuit.db.simulation_signal_integrity.list(),
    signal,
  ])
    expect(any_circuit_element.safeParse(record).success).toBe(true)
  expect(circuit.db.simulation_experiment.list()).toHaveLength(0)
  expect(circuit.db.pcb_stackup.list()).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
