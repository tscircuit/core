import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("stale owned trace ID does not delete an unrelated sibling trace or via", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <subcircuit name="TARGET" pcbX={-2.5}>
        <resistor
          name="R_TARGET"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </subcircuit>
      <subcircuit name="SIBLING" pcbX={2.5}>
        <resistor
          name="R_SIBLING"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </subcircuit>
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.36}
        text="STALE OWNED ID — SIBLING COPPER PRESERVED"
      />
      <pcbnoterect
        pcbX={4}
        pcbY={0}
        width={0.8}
        height={0.8}
        color="rgba(255,140,0,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext
        pcbX={3}
        pcbY={2.5}
        fontSize={0.28}
        text="UNRELATED SIBLING VIA REMAINS"
      />
      <pcbnotetext
        pcbX={-2.5}
        pcbY={-1.5}
        fontSize={0.28}
        text="DIRTY TARGET GROUP"
      />
      <pcbnotetext
        pcbX={2.5}
        pcbY={-1.5}
        fontSize={0.28}
        text="SIBLING GROUP"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.firstChild as Group
  const targetGroup = board.children.find(
    (child) => child.name === "TARGET",
  ) as Group
  const siblingGroup = board.children.find(
    (child) => child.name === "SIBLING",
  ) as Group
  expect(targetGroup.subcircuit_id).not.toBe(siblingGroup.subcircuit_id)

  const siblingTrace = circuit.db.pcb_trace.insert({
    subcircuit_id: siblingGroup.subcircuit_id!,
    route: [
      {
        route_type: "via",
        x: 4,
        y: 0,
        from_layer: "top",
        to_layer: "bottom",
      },
    ],
  })
  const siblingVia = circuit.db.pcb_via.insert({
    pcb_trace_id: siblingTrace.pcb_trace_id,
    subcircuit_id: siblingGroup.subcircuit_id!,
    x: 4,
    y: 0,
    hole_diameter: 0.3,
    outer_diameter: 0.6,
    layers: ["top", "bottom"],
    from_layer: "top",
    to_layer: "bottom",
  })

  targetGroup._materializedPcbTraceIdsFromPcbTraceOutput.add(
    siblingTrace.pcb_trace_id,
  )
  targetGroup._asyncAutoroutingResult = { output_pcb_traces: [] }
  targetGroup._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.get(siblingTrace.pcb_trace_id)).toMatchObject({
    pcb_trace_id: siblingTrace.pcb_trace_id,
    subcircuit_id: siblingGroup.subcircuit_id,
  })
  expect(circuit.db.pcb_via.get(siblingVia.pcb_via_id)).toMatchObject({
    pcb_via_id: siblingVia.pcb_via_id,
    pcb_trace_id: siblingTrace.pcb_trace_id,
    subcircuit_id: siblingGroup.subcircuit_id,
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
