import { expect, test } from "bun:test"
import type { PcbPadTraceClearanceError, PcbTraceError } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("preserves distinct PCB DRC errors returned by custom checks", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" routingDisabled>
      <drccheck
        name="generic-trace-overlap-check"
        checkFn={() =>
          ({
            type: "pcb_trace_error",
            error_type: "pcb_trace_error",
            pcb_trace_error_id: "overlap_trace1_pad1",
            message: "Generic trace overlap",
            pcb_trace_id: "trace1",
            source_trace_id: "source_trace1",
            pcb_component_ids: [],
            pcb_port_ids: [],
            center: { x: 0, y: 0 },
          }) satisfies PcbTraceError
        }
      />
      <drccheck
        name="typed-pad-trace-clearance-check"
        checkFn={() =>
          ({
            type: "pcb_pad_trace_clearance_error",
            error_type: "pcb_pad_trace_clearance_error",
            pcb_pad_trace_clearance_error_id: "pad_trace_clearance_trace1_pad1",
            message: "Typed pad/trace clearance",
            pcb_trace_id: "trace1",
            pcb_pad_id: "pad1",
            actual_clearance: 0,
            minimum_clearance: 0.1,
            center: { x: 0, y: 0 },
          }) satisfies PcbPadTraceClearanceError as never
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((elm) =>
      ["pcb_trace_error", "pcb_pad_trace_clearance_error"].includes(elm.type),
    )

  expect(errors).toHaveLength(2)
  expect(errors.map((error) => error.type)).toEqual([
    "pcb_trace_error",
    "pcb_pad_trace_clearance_error",
  ])
})
