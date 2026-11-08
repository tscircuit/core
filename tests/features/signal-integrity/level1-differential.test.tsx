import type { Port } from "lib/components/primitive-components/Port"
import { expect, test } from "bun:test"
import Board from "./fixtures/level1-differential"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("RFC Level 1 differential includes the placed RTERM without a termination prop", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(<Board />)
  await circuit.renderUntilSettled()
  const signal = circuit.db.simulation_signal.list()[0]
  expect(signal).toMatchObject({
    name: "BUS",
    bit_rate_bps: 250e3,
    driver: {
      kind: "differential",
      p_source_port_id: circuit.selectOne<Port>(".TX > .A")!.source_port_id,
      n_source_port_id: circuit.selectOne<Port>(".TX > .B")!.source_port_id,
    },
    receivers: [
      {
        kind: "differential",
        p_source_port_id: circuit.selectOne<Port>(".RX > .A")!.source_port_id,
        n_source_port_id: circuit.selectOne<Port>(".RX > .B")!.source_port_id,
      },
    ],
  })
  expect(circuit.db.simulation_signal.list()).toHaveLength(1)
  expect(circuit.db.source_component.getWhere({ name: "RTERM" })).toMatchObject(
    { ftype: "simple_resistor", resistance: 120 },
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 20_000)
