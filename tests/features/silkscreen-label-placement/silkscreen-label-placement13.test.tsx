import { expect, test } from "bun:test"
import { getPcbElementBounds } from "@tscircuit/circuit-json-util"
import {
  doBoundsShareArea,
  getTextBounds,
} from "lib/utils/silkscreen-label-placement/label-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a part's label without a position is placed beside it, one with a position stays put", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="22mm" height="12mm" routingDisabled>
      <pcbnotetext
        pcbY={5.4}
        fontSize={0.4}
        text="RST has no position: it moves off SW1. BOOT is placed by hand: it stays"
      />
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        pcbX={-5.5}
        pcbRotation={180}
      >
        <silkscreentext text="RST" />
      </pushbutton>
      <pushbutton name="SW2" footprint="pushbutton" pcbX={5.5}>
        <silkscreentext text="BOOT" pcbX={0} pcbY={-2.5} />
      </pushbutton>
    </board>,
  )
  await circuit.renderUntilSettled()

  const texts = circuit.db.pcb_silkscreen_text.list()
  const rstLabel = texts.find((text) => text.text === "RST")!
  const bootLabel = texts.find((text) => text.text === "BOOT")!
  const sw1 = circuit.db.pcb_component.get(rstLabel.pcb_component_id)!

  // RST started on SW1's center, upside down with the part
  const rstBounds = getTextBounds(rstLabel)
  const { pcb_component_id } = sw1
  const sw1CopperBoundsList = [
    ...circuit.db.pcb_plated_hole.list({ pcb_component_id }),
    ...circuit.db.pcb_smtpad.list({ pcb_component_id }),
  ].flatMap((copper) => getPcbElementBounds(copper) ?? [])
  expect(sw1CopperBoundsList.length).toBeGreaterThan(0)
  for (const copperBounds of sw1CopperBoundsList)
    expect(doBoundsShareArea(rstBounds, copperBounds)).toBe(false)
  expect([0, 90]).toContain(rstLabel.ccw_rotation!)
  expect(bootLabel.anchor_position).toEqual({ x: 5.5, y: -2.5 })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
