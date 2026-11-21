import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import { extendTraceEndpointsToReachPinsInsideExpandedBoundingBox } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/applyTracesFromSolverOutput"
import { asSchematicPortId } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/port-id-types"

test("neither endpoint claims a pin already reached along the path", () => {
  const db = cju([])
  const port = db.schematic_port.insert({
    schematic_component_id: "schematic_component_0",
    source_port_id: "source_port_0",
    center: { x: 0, y: 0 },
  })
  const portId = asSchematicPortId(port.schematic_port_id)
  // The first segment passes through the pin. The other endpoint is aligned
  // with the pin too, but extending it would not double back.
  const path = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ]

  // Reverse the path to also cover a candidate queued before the reverse stub.
  for (const points of [path, [...path].reverse()]) {
    expect(
      extendTraceEndpointsToReachPinsInsideExpandedBoundingBox(
        {
          points,
          schematicPortIds: [portId],
          componentBoundsByPortId: new Map([
            [portId, { minX: -1, maxX: 1, minY: -1, maxY: 1 }],
          ]),
          connectedTracePaths: [points],
        },
        db,
      ),
    ).toEqual(points)
  }
})
