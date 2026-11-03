import { expect, test } from "bun:test"
import {
  pcb_group,
  pcb_hole,
  pcb_smtpad,
  pcb_silkscreen_text,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel rail fixtures and silkscreen render without fake component owners", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" edgePadding="5mm">
      <board width="14mm" height="18mm" routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>
      <toolingrail name="LEFT_RAIL" side="left" width="5mm">
        <hole diameter="3mm" pcbY={-6} />
        <fiducial name="F1" padDiameter="1mm" pcbY={6} />
      </toolingrail>
      <toolingrail name="RIGHT_RAIL" side="right" width="5mm">
        <hole diameter="3mm" pcbY={-6} />
        <fiducial name="F2" padDiameter="1mm" pcbY={6} />
      </toolingrail>
      <hole diameter="2mm" pcbY={-12} />
      <silkscreentext text="PANEL A / REV 1" pcbY={12} fontSize={0.8} />
    </panel>,
  )
  await circuit.renderUntilSettled()
  const holes = circuit.db.pcb_hole.list()
  expect(holes).toHaveLength(3)
  expect(holes.map((hole) => ({ x: hole.x, y: hole.y }))).toEqual([
    { x: -9.5, y: -6 },
    { x: 9.5, y: -6 },
    { x: 0, y: -12 },
  ])
  const fiducials = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.shape === "circle")
  expect(fiducials.map((pad) => ({ x: pad.x, y: pad.y }))).toEqual([
    { x: -9.5, y: 6 },
    { x: 9.5, y: 6 },
  ])
  expect(
    circuit.db.pcb_silkscreen_text
      .list()
      .some((text) => text.text === "PANEL A / REV 1"),
  ).toBe(true)
  for (const group of circuit.db.pcb_group
    .list()
    .filter(
      (group) => group.name === "LEFT_RAIL" || group.name === "RIGHT_RAIL",
    ))
    pcb_group.parse(group)
  for (const hole of holes) pcb_hole.parse(hole)
  for (const fiducial of fiducials) pcb_smtpad.parse(fiducial)
  for (const text of circuit.db.pcb_silkscreen_text.list())
    pcb_silkscreen_text.parse(text)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showSolderMask: true })
})
