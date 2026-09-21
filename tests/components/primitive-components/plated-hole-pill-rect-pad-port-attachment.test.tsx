import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["A1"],
  pin2: ["A2"],
  pin3: ["SHIELD1"],
  pin4: ["SHIELD2"],
} as const

/**
 * Two circular holes plus two pill holes with rect pads — the construction
 * EasyEDA-generated footprints use for shielded connectors.
 */
const ShieldedPlug = (props: {
  name: string
  pcbX: number
  pcbY: number
  pcbRotation?: number
}) => (
  <chip
    name={props.name}
    pinLabels={pinLabels}
    pcbX={props.pcbX}
    pcbY={props.pcbY}
    pcbRotation={props.pcbRotation}
    footprint={
      <footprint>
        <platedhole
          portHints={["pin1"]}
          shape="circle"
          holeDiameter="1mm"
          outerDiameter="1.8mm"
          pcbX="-3mm"
          pcbY="-2mm"
        />
        <platedhole
          portHints={["pin2"]}
          shape="circle"
          holeDiameter="1mm"
          outerDiameter="1.8mm"
          pcbX="-3mm"
          pcbY="2mm"
        />
        <platedhole
          portHints={["pin3"]}
          shape="pill"
          rectPad
          holeWidth="2mm"
          holeHeight="0.8mm"
          outerWidth="2.8mm"
          outerHeight="1.6mm"
          pcbX="3mm"
          pcbY="-2mm"
        />
        <platedhole
          portHints={["pin4"]}
          shape="pill"
          rectPad
          holeWidth="2mm"
          holeHeight="0.8mm"
          outerWidth="2.8mm"
          outerHeight="1.6mm"
          pcbX="3mm"
          pcbY="2mm"
        />
      </footprint>
    }
  />
)

/**
 * Regression test: `shape="pill" rectPad` plated holes used to be inserted with
 * a null `pcb_plated_hole_id` (the pill+rectPad branch passed its own, still
 * unset id into the insert), so `doInitialPcbPortAttachment()` updated the wrong
 * record and the holes ended up linked to another component's port or to none.
 */
test("pill + rectPad plated holes attach to their own component's ports", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="18mm">
      <ShieldedPlug name="P_REF" pcbX={-8} pcbY={0} />
      <ShieldedPlug name="P_ROT" pcbX={8} pcbY={0} pcbRotation={90} />
    </board>,
  )

  circuit.render()

  const componentNameOfPcbComponent = (pcbComponentId: string) => {
    const pcbComponent = circuit.db.pcb_component.get(pcbComponentId)!
    return circuit.db.source_component.get(pcbComponent.source_component_id)!
      .name
  }

  const holes = circuit.db.pcb_plated_hole.list()
  expect(holes).toHaveLength(8)

  const seenHoleIds = new Set<string>()
  for (const hole of holes) {
    const owner = componentNameOfPcbComponent(hole.pcb_component_id!)

    // every plated hole carries its own, unique id
    expect(hole.pcb_plated_hole_id).toBeTruthy()
    expect(seenHoleIds.has(hole.pcb_plated_hole_id)).toBe(false)
    seenHoleIds.add(hole.pcb_plated_hole_id)

    // ... is attached to a port that exists ...
    expect(hole.pcb_port_id).toBeTruthy()
    const port = circuit.db.pcb_port.get(hole.pcb_port_id!)!
    expect(port).toBeTruthy()

    // ... belonging to the same component ...
    expect(componentNameOfPcbComponent(port.pcb_component_id!)).toBe(owner)

    // ... and to the pin its own hints ask for
    const hint = hole.port_hints?.find((hint) => /^pin\d+$/.test(hint))!
    expect(hint).toBeTruthy()
    const sourcePort = circuit.db.source_port.get(port.source_port_id!)!
    expect(sourcePort.pin_number).toBe(Number(hint.replace("pin", "")))
  }

  // and every pin of every instance is claimed by exactly one hole
  for (const name of ["P_REF", "P_ROT"]) {
    const claimedPins = holes
      .filter(
        (hole) => componentNameOfPcbComponent(hole.pcb_component_id!) === name,
      )
      .map(
        (hole) =>
          circuit.db.source_port.get(
            circuit.db.pcb_port.get(hole.pcb_port_id!)!.source_port_id!,
          )!.name,
      )
      .sort()
    expect(claimedPins).toEqual(["A1", "A2", "SHIELD1", "SHIELD2"])
  }
})
