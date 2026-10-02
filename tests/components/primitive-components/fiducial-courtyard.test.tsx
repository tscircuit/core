import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fiducial courtyard encloses the default soldermask opening", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10}>
      <chip name="F1">
        <fiducial name="FM1" pcbX={2} pcbY={3} padDiameter="0.8mm" />
      </chip>
      <pcbnotetext
        fontSize={0.35}
        text="Courtyard: default mask opening"
        pcbY={-3}
      />
    </board>,
  )
  circuit.render()

  const pad = circuit.db.pcb_smtpad.list()[0]
  expect(circuit.db.pcb_courtyard_circle.list()).toMatchObject([
    {
      center: { x: 2, y: 3 },
      radius: 0.8,
      layer: "top",
      pcb_component_id: pad.pcb_component_id,
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
    showSolderMask: true,
  })
})
