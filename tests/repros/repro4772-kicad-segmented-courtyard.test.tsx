import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsVertically } from "stack-svgs"
import { createKicadSegmentedCourtyardCircuit } from "./fixtures/kicad-segmented-courtyard"

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

  const label = (text: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="40"><rect width="800" height="40" fill="#151515"/><text x="400" y="26" text-anchor="middle" font-family="Arial" font-size="18" fill="white">${text}</text></svg>`
  await expect(
    stackSvgsVertically(
      [
        label("Four courtyard segments: placement throws; ALL routing skipped"),
        convertCircuitJsonToPcbSvg(segmented.circuit.getCircuitJson(), {
          showCourtyards: true,
        }),
        label(
          "Same pads and boundary as one polygon: placement succeeds; routing runs",
        ),
        convertCircuitJsonToPcbSvg(closed.circuit.getCircuitJson(), {
          showCourtyards: true,
        }),
      ],
      { gap: 8, normalizeSize: false },
    ),
  ).toMatchSvgSnapshot(import.meta.path)
}, 30_000)
