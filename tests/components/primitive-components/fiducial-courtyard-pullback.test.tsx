import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fiducial courtyard includes custom soldermask pullback on the bottom layer", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10}>
      <chip name="F1" layer="bottom" pcbX={2} pcbY={1} pcbRotation={90}>
        <footprint>
          <fiducial
            name="FM1"
            pcbX={1}
            pcbY={2}
            padDiameter="1mm"
            soldermaskPullback="0.2mm"
          />
        </footprint>
      </chip>
      <pcbnotetext
        fontSize={0.35}
        text="Bottom courtyard: 0.7mm radius"
        pcbY={-3}
      />
    </board>,
  )
  circuit.render()

  const pad = circuit.db.pcb_smtpad.list()[0]
  if (pad.shape !== "circle") throw new Error("Expected circular fiducial")
  expect(circuit.db.pcb_courtyard_circle.list()).toMatchObject([
    {
      center: { x: pad.x, y: pad.y },
      radius: 0.7,
      layer: "bottom",
      pcb_component_id: pad.pcb_component_id,
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
    showSolderMask: true,
    layer: "bottom",
  })
})
