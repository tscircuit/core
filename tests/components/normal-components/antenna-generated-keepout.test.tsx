import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("generated antenna keepout spans every copper layer without blocking its feed", async () => {
  const { circuit } = getTestFixture()
  let antennaCopperBeforeRouting: PcbTrace | undefined
  circuit.on("autorouting:start", () => {
    antennaCopperBeforeRouting = structuredClone(
      circuit.db.pcb_trace.list().find((trace) => trace.pcb_component_id),
    )
  })

  circuit.add(
    <board width="40mm" height="20mm" layers={4}>
      <testpoint name="RF" footprintVariant="pad" pcbX={0} pcbY={-6} />
      <antenna
        name="ANT1"
        antennaShape="2.4ghz_meandered_inverted_f"
        pcbX={0}
        pcbY={0}
      />
      <trace from=".RF > .pin1" to=".ANT1 > .feed" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const antennaSourceComponent = circuit.db.source_component.getWhere({
    name: "ANT1",
  })!
  const antennaPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: antennaSourceComponent.source_component_id,
  })!
  const keepouts = circuit.db.pcb_keepout.list()
  expect(keepouts).toHaveLength(3)
  expect(
    keepouts.every((keepout) =>
      keepout.excluded_pcb_component_ids?.includes(
        antennaPcbComponent.pcb_component_id,
      ),
    ),
  ).toBeTrue()
  expect(
    keepouts.every(
      (keepout) =>
        keepout.layers.length === 4 &&
        ["top", "inner1", "inner2", "bottom"].every((layer) =>
          keepout.layers.includes(layer as (typeof keepout.layers)[number]),
        ),
    ),
  ).toBeTrue()
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(antennaCopperBeforeRouting).toBeDefined()
  expect(
    circuit.db.pcb_trace
      .list()
      .find(
        (trace) =>
          trace.pcb_component_id === antennaPcbComponent.pcb_component_id,
      )?.route,
  ).toEqual(
    antennaCopperBeforeRouting!.route.map((point) =>
      expect.objectContaining(point),
    ),
  )
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
