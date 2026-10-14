import { expect, test } from "bun:test"
import { join } from "node:path"
import { cju } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { extractPcbPrimitivesFromCircuitJson } from "lib/utils/extractPcbPrimitivesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const contactNames = [
  "A1",
  "A4",
  "A5",
  "A6",
  "A7",
  "A8",
  "A9",
  "A12",
  "B12",
  "B9",
  "B8",
  "B7",
  "B6",
  "B5",
  "B4",
  "B1",
  "S1",
  "S2",
  "S3",
  "S4",
] as const

/**
 * Connector geometry copied from the published USB4105-compatible export:
 * https://github.com/AnasSarkiz/new_tscircuit_landing_page/blob/066cba26d9e773b76cd97baa7538ba7c7a11f74e/public/circuit/tscircuit.json
 * Its points are board-world mm (+X right, +Y top, +Z above, right-handed).
 * Extraction converts them to component-local points before placement.
 * Name each physical contact separately so every VBUS/GND contact is routed.
 */
const createUsbConnectorFootprint = async () => {
  const sourceCircuitJson = (await Bun.file(
    join(
      import.meta.dir,
      "assets/usb4105-compatible-oval-shell-source.circuit.json",
    ),
  ).json()) as AnyCircuitElement[]
  const sourcePcbComponent = sourceCircuitJson.find(
    (element) => element.type === "pcb_component",
  )!
  let physicalPinNumber = 0
  const sourcePrimitives = sourceCircuitJson
    .filter((element) => element.type !== "pcb_component")
    .map((element) => {
      if (element.type !== "pcb_smtpad" && element.type !== "pcb_plated_hole") {
        return element
      }
      return { ...element, port_hints: [`pin${++physicalPinNumber}`] }
    })
  const footprint = new Footprint({})
  for (const primitive of extractPcbPrimitivesFromCircuitJson({
    pcbComponent: sourcePcbComponent,
    db: cju(sourcePrimitives),
    componentName: "J1",
  })) {
    footprint.add(primitive)
  }
  return footprint
}

test.failing("USB-C CC traces avoid rotated oval shield slots", async () => {
  const { circuit } = getTestFixture()
  const footprint = await createUsbConnectorFootprint()
  circuit.add(
    <board width={26} height={22} schematicDisabled>
      <chip
        name="J1"
        mpn="USB4105-GF-A compatible"
        pcbX={-6}
        pcbY={0}
        pcbRotation={90}
        pinLabels={Object.fromEntries(
          contactNames.map((name, index) => [`pin${index + 1}`, name]),
        )}
      />
      <resistor
        name="R_CC1"
        resistance="5.1k"
        footprint="0603"
        pcbX={-2.4}
        pcbY={-7.8}
      />
      <resistor
        name="R_CC2"
        resistance="5.1k"
        footprint="0603"
        pcbX={-2.4}
        pcbY={7.8}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0603"
        pcbX={2}
        pcbY={3}
      />
      <pinheader
        name="J2"
        pinCount={2}
        pitch="2.54mm"
        pcbX={8}
        pcbY={0}
        pinLabels={{ pin1: "VBUS", pin2: "GND" }}
      />
      <trace name="CC1" from=".J1 > .A5" to=".R_CC1 > .pin1" />
      <trace name="CC2" from=".J1 > .B5" to=".R_CC2 > .pin1" />
      {[
        ...["A1", "A12", "B12", "B1", "S1", "S2", "S3", "S4"].map(
          (contact) => `.J1 > .${contact}`,
        ),
        ".R_CC1 > .pin2",
        ".R_CC2 > .pin2",
        ".C1 > .pin2",
        ".J2 > .pin2",
      ].map((from) => (
        <trace key={from} from={from} to="net.GND" />
      ))}
      {[
        ...["A4", "A9", "B9", "B4"].map((contact) => `.J1 > .${contact}`),
        ".C1 > .pin1",
        ".J2 > .pin1",
      ].map((from) => (
        <trace key={from} from={from} to="net.VBUS" />
      ))}
      <pcbnotetext
        text="USB-C 5V: CC TRACES MUST CLEAR GROUNDED SHIELD SLOTS"
        fontSize={0.55}
        pcbY={10}
      />
    </board>,
  )
  const connector = circuit.selectOne(".J1")!
  connector.add(footprint)
  await circuit.renderUntilSettled()

  const shieldSlots = circuit.db.pcb_plated_hole
    .list()
    .filter((hole) => hole.pcb_component_id === connector.pcb_component_id)
  const shieldPortIds = new Set(shieldSlots.map((hole) => hole.pcb_port_id))
  const ccSourceTraces = circuit.db.source_trace
    .list()
    .filter((trace) => trace.name === "CC1" || trace.name === "CC2")
  const routedTraces = circuit.db.pcb_trace.list()
  const accidentalShieldContacts = circuit.db.pcb_trace_error
    .list()
    .filter((error) =>
      error.pcb_port_ids?.some((pcbPortId) => shieldPortIds.has(pcbPortId)),
    )

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 850,
    shouldDrawErrors: true,
    showCourtyards: true,
  })
  expect({
    connectorCopperPads: circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === connector.pcb_component_id)
      .length,
    slotShapes: shieldSlots.map((hole) => hole.shape),
    slotRotations: shieldSlots.map((hole) =>
      "ccw_rotation" in hole ? hole.ccw_rotation : undefined,
    ),
    ambiguousPorts: circuit.db.source_ambiguous_port_reference.list().length,
    placementErrors: circuit.db.pcb_footprint_overlap_error.list().length,
    routedCcConnections: ccSourceTraces.filter((sourceTrace) =>
      routedTraces.some(
        (trace) => trace.source_trace_id === sourceTrace.source_trace_id,
      ),
    ).length,
    accidentalShieldContacts: accidentalShieldContacts.length,
  }).toEqual({
    connectorCopperPads: 18,
    slotShapes: ["oval", "oval"],
    slotRotations: [90, 90],
    ambiguousPorts: 0,
    placementErrors: 0,
    routedCcConnections: 2,
    accidentalShieldContacts: 0,
  })
})
