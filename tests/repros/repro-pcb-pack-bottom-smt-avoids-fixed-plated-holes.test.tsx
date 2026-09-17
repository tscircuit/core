import { expect, test } from "bun:test"
import type { PcbPlatedHoleCircle, PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPack keeps bottom-side SMT pads clear of fixed plated holes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm" pcbPack routingDisabled>
      <chip
        name="J1"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <platedhole
              pcbY={-2.54}
              portHints={["pin1"]}
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="1.8mm"
            />
            <platedhole
              pcbY={0}
              portHints={["pin2"]}
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="1.8mm"
            />
            <platedhole
              pcbY={2.54}
              portHints={["pin3"]}
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="1.8mm"
            />
          </footprint>
        }
      />

      <resistor name="R1" resistance="10k" footprint="0603" layer="bottom" />

      <trace from=".J1 > .pin1" to=".R1 > .pin1" />

      <pcbnotetext
        pcbY={4.2}
        text="BOTTOM SMT MUST AVOID THROUGH-HOLE COPPER"
        fontSize="0.45mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showCourtyards: true,
  })

  const r1SourceComponent = circuit.db.source_component.getWhere({
    name: "R1",
  })!
  const r1PcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: r1SourceComponent.source_component_id,
  })!
  const j1SourceComponent = circuit.db.source_component.getWhere({
    name: "J1",
  })!
  const j1PcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: j1SourceComponent.source_component_id,
  })!
  const r1Pads = (circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]).filter(
    (pad) =>
      pad.pcb_component_id === r1PcbComponent.pcb_component_id &&
      pad.shape === "rect",
  )
  const j1Holes = (
    circuit.db.pcb_plated_hole.list() as PcbPlatedHoleCircle[]
  ).filter((hole) => hole.pcb_component_id === j1PcbComponent.pcb_component_id)

  const hasPadToPlatedHoleOverlap = r1Pads.some((pad) =>
    j1Holes.some((hole) => {
      const dx = Math.max(Math.abs(hole.x - pad.x) - pad.width / 2, 0)
      const dy = Math.max(Math.abs(hole.y - pad.y) - pad.height / 2, 0)
      return Math.hypot(dx, dy) < hole.outer_diameter / 2
    }),
  )

  expect(hasPadToPlatedHoleOverlap).toBe(false)
})
