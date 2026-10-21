import { expect, test } from "bun:test"
import { Fragment } from "react"
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
 * Points below are footprint-local mm (+X right, +Y top, +Z above,
 * right-handed), relative to the export's component centre (-103, -34.725).
 * Name each physical contact separately so every VBUS/GND contact is routed.
 */
const usbConnectorFootprint = (
  <footprint>
    {contactNames.slice(0, 16).map((contactName, index) => (
      <Fragment key={contactName}>
        <smtpad
          portHints={[`pin${index + 1}`]}
          shape="rect"
          width={0.3}
          height={1.4}
          pcbX={-3.75 + index * 0.5}
          pcbY={0.875}
        />
      </Fragment>
    ))}
    <platedhole
      portHints={["pin17"]}
      shape="oval"
      outerWidth={2.2}
      outerHeight={3.2}
      holeWidth={1.2}
      holeHeight={2.2}
      pcbX={-4.45}
      pcbY={-1.275}
    />
    <platedhole
      portHints={["pin18"]}
      shape="oval"
      outerWidth={2.2}
      outerHeight={3.2}
      holeWidth={1.2}
      holeHeight={2.2}
      pcbX={4.45}
      pcbY={-1.275}
    />
    <smtpad
      portHints={["pin19"]}
      shape="rect"
      width={2}
      height={1.8}
      pcbX={-4.75}
      pcbY={1.975}
    />
    <smtpad
      portHints={["pin20"]}
      shape="rect"
      width={2}
      height={1.8}
      pcbX={4.75}
      pcbY={1.975}
    />
    <silkscreenrect
      pcbX={0}
      pcbY={-1.575}
      width={9.2}
      height={7.4}
      strokeWidth={0.15}
      filled={false}
    />
  </footprint>
)

test("USB-C CC traces avoid rotated oval shield slots", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={22} schematicDisabled>
      <chip
        name="J1"
        mpn="USB4105-GF-A compatible"
        pcbX={-6}
        pcbY={0}
        pcbRotation={90}
        footprint={usbConnectorFootprint}
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
