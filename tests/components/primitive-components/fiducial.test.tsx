import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbSmtPadCircle } from "circuit-json"

test("Fiducial rendering", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name={"C1"}>
        <fiducial name="F1" pcbX="2mm" pcbY="3mm" padDiameter="0.8mm" />
      </chip>
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list() as PcbSmtPadCircle[]

  expect(smtpads.length).toBe(1)
  const fiducialPad = smtpads[0]
  expect(fiducialPad.shape).toBe("circle")
  expect(fiducialPad.x).toBe(2)
  expect(fiducialPad.y).toBe(3)
  expect(fiducialPad.radius).toBe(0.4)
  expect(fiducialPad.layer).toBe("top")
  expect(fiducialPad.is_covered_with_solder_mask).toBe(true)
  expect(fiducialPad.pcb_component_id).toBeDefined()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showSolderMask: true })
})

test("Fiducial with soldermask pullback", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="C1">
        <fiducial name="F2" padDiameter="1mm" soldermaskPullback="0.1mm" />
      </chip>
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list() as PcbSmtPadCircle[]

  expect(smtpads.length).toBe(1)
  const fiducialPad = smtpads[0]
  expect(fiducialPad.soldermask_margin).toBe(0.1)

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-with-soldermask-pullback",
    { showSolderMask: true },
  )
})
