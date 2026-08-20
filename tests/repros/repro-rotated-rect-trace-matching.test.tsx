import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// When a rectangular SMT pad has a ccw_rotation (such as 90° on vertical chip
// footprints), isPointInSmtPad checks containment using the pad's unrotated
// width and height. This can cause false overlap matches with adjacent pads
// and incorrect source_trace_id assignments during post-routing trace matching.
test.failing(
  "trace matching for rotated rect pads works correctly",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="20mm" autorouter="default">
        <chip name="U1" pcbX={0} pcbY={0}>
          <footprint>
            <smtpad
              shape="rotated_rect"
              pcbX={-0.325}
              pcbY={0}
              width={1.65}
              height={0.4}
              layer="top"
              ccwRotation={90}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rotated_rect"
              pcbX={0.325}
              pcbY={0}
              width={1.65}
              height={0.4}
              layer="top"
              ccwRotation={90}
              portHints={["pin2"]}
            />
          </footprint>
        </chip>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbX={-5}
          pcbY={-2}
        />
        <resistor
          name="R2"
          resistance="10k"
          footprint="0402"
          pcbX={5}
          pcbY={-2}
        />
        <trace from=".R1 > .pin2" to=".U1 > .pin1" />
        <trace from=".R2 > .pin1" to=".U1 > .pin2" />
      </board>,
    )

    await circuit.renderUntilSettled()

    // PCB renders correctly
    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    // Verify that the generated pcb_traces have correct and distinct source_trace_ids
    const elements = circuit.getCircuitJson()
    const pcbTraces = elements.filter((el) => el.type === "pcb_trace")

    // There should be exactly two traces routed on PCB
    expect(pcbTraces.length).toBe(2)

    // Because of the SMT pad rotation mismatch bug, both traces get mapped
    // to the same source_trace_id, so the set size will be 1 instead of 2.
    const sourceTraceIds = pcbTraces.map((t) => t.source_trace_id)
    expect(new Set(sourceTraceIds).size).toBe(2)
  },
)
