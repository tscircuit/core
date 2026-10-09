import { expect, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import { getSilkscreenLabelPlacementSolverParams } from "lib/components/normal-components/Board/Board_doInitialSilkscreenOverlapAdjustment/getSilkscreenLabelPlacementSolverParams"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a part's bounds leave out its own label, even one placed by hand", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="8mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbSx={{ "& silkscreentext": { pcbX: 0, pcbY: -3 } }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const r1Label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "R1")!
  expect(r1Label.anchor_position.y).toBeCloseTo(-3)

  const { parts } = getSilkscreenLabelPlacementSolverParams(
    circuit.firstChild as Board,
    "top",
  )
  const r1Part = parts.find(
    (part) => part.pcbComponentId === r1Label.pcb_component_id,
  )!
  // An 0402's courtyard ends 0.47 mm below its center
  expect(r1Part.bounds.minY).toBeCloseTo(-0.47)
})
