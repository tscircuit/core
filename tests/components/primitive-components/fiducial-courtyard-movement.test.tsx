import { expect, test } from "bun:test"
import { Fiducial } from "lib/components/primitive-components/Fiducial"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fiducial courtyard follows layout placement and subsequent movement", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10}>
      <chip name="F1">
        <fiducial name="FM1" padDiameter={1} soldermaskPullback={0} />
      </chip>
      <pcbnotetext
        fontSize={0.35}
        text="Moved courtyard, zero mask pullback"
        pcbY={-3}
      />
    </board>,
  )
  circuit.render()
  const fiducial = circuit.selectOne("fiducial")
  if (!(fiducial instanceof Fiducial)) throw new Error("Expected fiducial")
  fiducial._setPositionFromLayout({ x: 1, y: 2 })
  expect(circuit.db.pcb_courtyard_circle.list()[0].center).toEqual({
    x: 1,
    y: 2,
  })
  fiducial._moveCircuitJsonElements({ deltaX: 2, deltaY: -1 })

  expect(circuit.db.pcb_smtpad.list()[0]).toMatchObject({
    x: 3,
    y: 1,
    soldermask_margin: 0,
  })
  expect(circuit.db.pcb_courtyard_circle.list()).toMatchObject([
    { center: { x: 3, y: 1 }, radius: 0.5 },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
    showSolderMask: true,
  })
})
