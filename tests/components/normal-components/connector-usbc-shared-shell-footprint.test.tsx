import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin13: ["EH1", "SHELL1"],
  pin14: ["EH2", "SHELL2"],
  pin15: ["GND1", "A1B12"],
  pin16: ["VBUS1", "A4B9"],
  pin17: ["SBU2", "B8"],
  pin18: ["CC1", "A5"],
  pin19: ["Dn2", "DM2", "B7"],
  pin20: ["Dp1", "A6"],
  pin21: ["Dn1", "DM1", "A7"],
  pin22: ["Dp2", "B6"],
  pin23: ["SBU1", "A8"],
  pin24: ["CC2", "B5"],
  pin25: ["VBUS2", "B4A9"],
  pin26: ["GND2", "B1A12"],
} as const

// Footprint-local mm: +X right, +Y top. These are the 12 contacts and
// four shared-numbered shell tabs of TYPE-C-16PIN-2MD(073).
const UsbFootprint = () => (
  <footprint>
    {[-1, 1].flatMap((side) =>
      [
        { y: 1.5751, holeHeight: 1.3, ring: 0.25 },
        { y: -2.625, holeHeight: 1, ring: 0.3 },
      ].map(({ y, holeHeight, ring }) => (
        <Fragment key={`${side}:${y}`}>
          <platedhole
            shape="pill"
            portHints={[side < 0 ? "13" : "14"]}
            pcbX={side * 4.325}
            pcbY={y}
            outerWidth={0.6 + 2 * ring}
            outerHeight={holeHeight + 2 * ring}
            holeWidth={0.6}
            holeHeight={holeHeight}
          />
        </Fragment>
      )),
    )}
    {[
      -3.2, -2.4, -1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75, 2.4, 3.2,
    ].map((x, contactIndex) => (
      <Fragment key={contactIndex}>
        <smtpad
          shape="rect"
          portHints={[String(contactIndex + 15)]}
          pcbX={x}
          pcbY={2.125}
          width={[0, 1, 10, 11].includes(contactIndex) ? 0.55 : 0.3}
          height={1.1}
        />
      </Fragment>
    ))}
    <silkscreenrect pcbY={-0.65} width={8.7} height={6.3} />
  </footprint>
)

test("native USB-C and generic chips own every shared shell tab", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={44} height={22} autorouter="auto-local">
      <connector
        name="J_USB"
        standard="usb_c"
        pcbX={-11}
        schX={-4}
        pinLabels={pinLabels}
        internallyConnectedPins={[["pin13", "pin14"]]}
        connections={{ EH1: "net.GND" }}
        footprint={<UsbFootprint />}
      />
      <chip
        name="J_GENERIC"
        pcbX={11}
        schX={4}
        pinLabels={pinLabels}
        internallyConnectedPins={[["pin13", "pin14"]]}
        connections={{ EH1: "net.GND" }}
        footprint={<UsbFootprint />}
      />
      <pinheader
        name="J_GND"
        pinCount={1}
        pcbY={7}
        schY={4}
        connections={{ pin1: "net.GND" }}
      />
      <net name="GND" isGroundNet />
      <pcbnotetext pcbX={-11} pcbY={-6} text="Native USB-C" fontSize={0.7} />
      <pcbnotetext pcbX={11} pcbY={-6} text="Generic chip" fontSize={0.7} />
      <pcbnotetext
        pcbY={-9}
        text="All four shell tabs are owned GND terminals"
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const connectivity = getFullConnectivityMapFromCircuitJson(
    circuit.getCircuitJson(),
  )
  const groundNet = circuit.db.source_net.getWhere({ name: "GND" })!
  for (const name of ["J_USB", "J_GENERIC"]) {
    const sourceComponent = circuit.db.source_component.getWhere({ name })!
    const sourcePorts = circuit.db.source_port.list({
      source_component_id: sourceComponent.source_component_id,
    })
    const pcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const pcbPorts = circuit.db.pcb_port.list({
      pcb_component_id: pcbComponent.pcb_component_id,
    })
    const shellTabs = circuit.db.pcb_plated_hole.list({
      pcb_component_id: pcbComponent.pcb_component_id,
    })
    expect(sourcePorts).toHaveLength(16)
    expect(pcbPorts).toHaveLength(16)
    expect(shellTabs).toHaveLength(4)
    expect(new Set(shellTabs.map((tab) => tab.pcb_port_id)).size).toBe(4)
    for (const tab of shellTabs) {
      const pcbPort = circuit.db.pcb_port.get(tab.pcb_port_id!)!
      const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id!)!
      expect(sourcePort.source_component_id).toBe(
        sourceComponent.source_component_id,
      )
      expect(connectivity.getNetConnectedToId(sourcePort.source_port_id)).toBe(
        connectivity.getNetConnectedToId(groundNet.source_net_id),
      )
      expect(pcbPort.x).toBeCloseTo(tab.x, 6)
      expect(pcbPort.y).toBeCloseTo(tab.y, 6)
    }
    for (const pinNumber of [13, 14]) {
      const primaryPort = sourcePorts.find(
        (port) => port.pin_number === pinNumber,
      )!
      const physicalPort = sourcePorts.find(
        (port) => port.name === `pin${pinNumber}_internal_1`,
      )!
      expect(
        circuit.db.source_component_internal_connection
          .list()
          .some(
            (connection) =>
              connection.source_port_ids.includes(primaryPort.source_port_id) &&
              connection.source_port_ids.includes(physicalPort.source_port_id),
          ),
      ).toBe(true)
    }
    for (const pinNumber of [13, 14, 19, 21]) {
      const sourcePort = sourcePorts.find(
        (port) => port.pin_number === pinNumber,
      )!
      expect(
        circuit.db.schematic_port
          .list()
          .filter((port) => port.source_port_id === sourcePort.source_port_id),
      ).toHaveLength(1)
    }
  }
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 30000)
