import { expect, test } from "bun:test"
import {
  doSegmentsIntersect,
  pointToSegmentDistance,
} from "@tscircuit/math-utils"
import type { NetLabel } from "lib/components/primitive-components/NetLabel"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { PdSheet } from "./pd-sheet"

test("PD sheet with explicitly placed GND labels", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(<PdSheet />)

  await circuit.renderUntilSettled()

  const groundLabelComponent = circuit
    .selectAll("netlabel")
    .find(
      (label) => label._parsedProps.connection === ".U_PD > .pin19",
    ) as NetLabel
  const groundLabel = circuit.db.schematic_net_label.get(
    groundLabelComponent.schematic_net_label_id!,
  )!
  const groundNet = circuit.db.source_net.get(groundLabel.source_net_id!)!
  const groundEdges = circuit.db.schematic_trace
    .list()
    .filter(
      (trace) =>
        trace.subcircuit_connectivity_map_key ===
        groundNet.subcircuit_connectivity_map_key,
    )
    .flatMap((trace) => trace.edges)

  // Check emitted geometry: all three bottom ground pins must reach the fixed
  // label, and the automatically routed EP branch must not run through it.
  const connectedEdges = new Set(
    groundEdges.filter(
      (edge) =>
        pointToSegmentDistance(
          groundLabel.anchor_position!,
          edge.from,
          edge.to,
        ) < 1e-6,
    ),
  )
  let previousSize = -1
  while (previousSize !== connectedEdges.size) {
    previousSize = connectedEdges.size
    for (const edge of groundEdges) {
      if (
        [...connectedEdges].some((connected) =>
          doSegmentsIntersect(edge.from, edge.to, connected.from, connected.to),
        )
      ) {
        connectedEdges.add(edge)
      }
    }
  }
  for (const pin of ["pin19", "pin22", "pin25"]) {
    const port = circuit.selectOne(`.U_PD > .${pin}`) as Port
    const center = circuit.db.schematic_port.get(
      port.schematic_port_id!,
    )!.center
    expect(
      [...connectedEdges].some(
        (edge) => pointToSegmentDistance(center, edge.from, edge.to) < 1e-6,
      ),
    ).toBe(true)
  }
  expect(
    groundEdges.some(
      (edge) =>
        pointToSegmentDistance(groundLabel.center, edge.from, edge.to) < 1e-6,
    ),
  ).toBe(false)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})
