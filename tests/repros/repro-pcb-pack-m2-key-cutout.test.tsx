import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import type { AnyCircuitElement } from "circuit-json"
import { applyToPoint, fromTriangles, rotateDEG } from "transformation-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("packing MicroMod M.2 connectors keeps their key notches aligned with their contacts", async () => {
  const { circuit } = getTestFixture()
  // Use the real 67-contact footprint from the MicroMod CO2 board regression:
  // tests/repros/repro-micromod-co2-pcbpack-affects-connector.test.tsx.
  circuit.add(
    <board width={55} height={40} pcbPack routingDisabled schematicDisabled>
      <group name="ConnectorA" subcircuit>
        <chip name="J1" footprint="m2host" pcbRotation={-90} />
      </group>
      <group name="ConnectorB" subcircuit>
        <chip name="J2" footprint="m2host" />
      </group>
      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
      <pcbnotetext
        text="MICROMOD M.2: KEY NOTCHES MUST STAY BETWEEN CONTACTS 23 AND 32"
        pcbY={17}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const footprint = fp.string("m2host").soup() as AnyCircuitElement[]
  const authoredNotch = footprint.find(
    (element) => element.type === "pcb_cutout" && element.shape === "rect",
  )!
  if (authoredNotch.type !== "pcb_cutout" || authoredNotch.shape !== "rect")
    throw new Error("Missing M.2 key notch")
  const authoredPads = footprint.filter(
    (element) => element.type === "pcb_smtpad" && element.shape === "rect",
  )
  // These actual contacts are non-collinear, so their emitted positions also
  // establish the connector's orientation without repeating the packing matrix.
  const referencePins = ["1", "2", "75"]
  const authoredContacts = referencePins.map(
    (pin) => authoredPads.find((pad) => pad.port_hints?.includes(pin))!,
  )
  const notches = circuit.db.pcb_cutout.list()
  expect(notches).toHaveLength(2)
  for (const name of ["J1", "J2"]) {
    const sourceComponent = circuit.db.source_component.getWhere({ name })!
    const connector = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const contacts = circuit.db.pcb_smtpad
      .list({ pcb_component_id: connector.pcb_component_id })
      .filter((pad) => pad.shape === "rect" || pad.shape === "rotated_rect")
    expect(contacts).toHaveLength(67)
    const emittedContacts = referencePins.map(
      (pin) => contacts.find((pad) => pad.port_hints?.includes(pin))!,
    )
    // Footprint-local points -> right-handed board-world mm (+X right, +Y up).
    const footprintToBoard = fromTriangles(authoredContacts, emittedContacts)
    const notch = notches.find(
      (cutout) => cutout.pcb_component_id === connector.pcb_component_id,
    )!
    if (notch.shape !== "rect") throw new Error("Expected M.2 key notch")
    const expectedCenter = applyToPoint(footprintToBoard, authoredNotch.center)
    expect(notch.center.x).toBeCloseTo(expectedCenter.x, 7)
    expect(notch.center.y).toBeCloseTo(expectedCenter.y, 7)
    expect(notch.width).toBe(authoredNotch.width)
    expect(notch.height).toBe(authoredNotch.height)
    // A direction picks up rotation but no translation. Either axis sign
    // represents the same rectangular notch.
    const expectedAxis = applyToPoint(
      { ...footprintToBoard, e: 0, f: 0 },
      { x: 1, y: 0 },
    )
    const notchAxis = applyToPoint(rotateDEG(notch.rotation ?? 0), {
      x: 1,
      y: 0,
    })
    expect(
      Math.abs(notchAxis.x * expectedAxis.y - notchAxis.y * expectedAxis.x),
    ).toBeLessThan(1e-7)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
    width: 1200,
    height: 850,
  })
})
