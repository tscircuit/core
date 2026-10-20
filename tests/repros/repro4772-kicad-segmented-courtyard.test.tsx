import { expect, test } from "bun:test"
import { createKicadSegmentedCourtyardCircuit } from "./fixtures/kicad-segmented-courtyard"
import { renderKicadCourtyardComparison } from "./fixtures/render-kicad-courtyard-comparison"

test("four KiCad courtyard segments block all routing while the same closed boundary routes", async () => {
  const segmented = createKicadSegmentedCourtyardCircuit()
  const closed = createKicadSegmentedCourtyardCircuit({ closedCourtyard: true })

  await segmented.circuit.renderUntilSettled()
  await closed.circuit.renderUntilSettled()

  for (const fixture of [segmented, closed]) {
    expect(fixture.getFootprintLoadCount()).toBe(1)
    expect(
      fixture.circuit.db.external_footprint_load_error.list(),
    ).toHaveLength(0)
    expect(fixture.circuit.db.source_trace.list()).toHaveLength(3)
    expect(fixture.circuit.db.pcb_footprint_overlap_error.list()).toHaveLength(
      0,
    )
    expect(fixture.circuit.db.pcb_courtyard_overlap_error.list()).toHaveLength(
      0,
    )
  }

  const segmentedCourtyards = segmented.circuit.db.pcb_courtyard_outline.list()
  expect(segmentedCourtyards).toHaveLength(4)
  expect(
    segmentedCourtyards.map((courtyard) => courtyard.outline.length),
  ).toEqual([2, 2, 2, 2])
  expect(segmented.getAutoroutingStartCount()).toBe(0)
  expect(segmented.circuit.db.pcb_trace.list()).toHaveLength(0)
  const autoroutingErrors = segmented.circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0].message).toContain(
    "Autorouting was skipped because PCB placement checks could not be completed:",
  )
  expect(autoroutingErrors[0].message).toContain(
    "A ring must enclose a non-zero area",
  )
  const runtimeErrors = segmented.circuit.db.source_runtime_error.list()
  expect(runtimeErrors).toHaveLength(1)
  expect(runtimeErrors[0].message).toContain(
    "DRC could not complete (placement):",
  )
  expect(runtimeErrors[0].message).toContain(
    "A ring must enclose a non-zero area",
  )

  expect(closed.circuit.db.pcb_courtyard_outline.list()).toHaveLength(1)
  expect(
    closed.circuit.db.pcb_courtyard_outline.list()[0].outline,
  ).toHaveLength(4)
  expect(closed.circuit.db.source_runtime_error.list()).toHaveLength(0)
  expect(closed.circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(closed.getAutoroutingStartCount()).toBe(1)
  expect(closed.circuit.db.pcb_trace.list()).toHaveLength(3)
  expect(closed.circuit.db.pcb_smtpad.list()).toEqual(
    segmented.circuit.db.pcb_smtpad.list(),
  )

  await expect(
    renderKicadCourtyardComparison(
      segmented.circuit.getCircuitJson(),
      closed.circuit.getCircuitJson(),
    ),
  ).toMatchSvgSnapshot(import.meta.path)
}, 30_000)
