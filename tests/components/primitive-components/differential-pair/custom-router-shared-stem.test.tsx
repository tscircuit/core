import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { expect, test } from "bun:test"
import { getDifferentialPairRoutingFailure } from "lib/utils/autorouting/getDifferentialPairRoutingFailure"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"

test("custom router shared stems reject all copper with an ownership error", async () => {
  const algorithmFn = createBasicAutorouter(async (srj) => {
    const traces: SimplifiedPcbTrace[] = srj.connections.map((c) => ({
      type: "pcb_trace",
      pcb_trace_id: `copper_${c.name}`,
      connection_name: c.name,
      source_trace_id: c.source_trace_id,
      connectsTo: c.pointsToConnect.map((p) => {
        const pointId = p.pointId ?? p.pcb_port_id
        if (!pointId)
          throw new Error("Shared-stem fixture is missing a terminal")
        return pointId
      }),
      route: c.pointsToConnect.map((p, i) => ({
        route_type: "wire",
        x: p.x,
        y: p.y,
        layer: "top",
        width: 0.15,
        ...(i === 0
          ? { start_pcb_port_id: p.pcb_port_id }
          : { end_pcb_port_id: p.pcb_port_id }),
      })),
    }))
    expect(getDifferentialPairRoutingFailure(srj, traces)).toMatchObject({
      reason: "ownership_violation",
      pairIndex: 0,
    })
    return traces
  })
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={16}
      height={10}
      schematicDisabled
      autorouter={{ local: true, algorithmFn }}
    >
      <chip name="J1" pcbX={-5} footprint={differentialPairPathPads()} />
      <chip name="ESD" footprint={differentialPairPathPads()} />
      <chip name="MCU" pcbX={-3} footprint={differentialPairPathPads()} />
      <trace name="P1" from=".J1 > .pin1" to=".ESD > .pin1" />
      <trace name="P2" from=".ESD > .pin1" to=".MCU > .pin1" />
      <trace name="N1" from=".J1 > .pin2" to=".ESD > .pin2" />
      <trace name="N2" from=".ESD > .pin2" to=".MCU > .pin2" />
      <differentialpair
        name="USB"
        positiveConnection={["P1", "P2"]}
        negativeConnection={["N1", "N2"]}
        maxLengthSkew={0}
      />
      <pcbnotetext
        pcbY={-3}
        text="Custom router returns overlapping stems: reject all copper"
        fontSize={0.3}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([
    expect.objectContaining({
      message: expect.stringContaining(
        "lost its declared endpoints or ownership",
      ),
    }),
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
})
