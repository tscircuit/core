import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import {
  USB2517I_JZXFootprint,
  USB4105_GF_AFootprint,
  USBLC6_2SC6Footprint,
} from "tests/fixtures/four-motor-usbc/footprints"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Extracted from UsbDataSystem.tsx, MotorDataPorts.tsx and parts.tsx in the
// 4-Motor USB-C motherboard. Both nets have FIVE physical signal terminals:
// one hub pin, both ESD flow-through pads, and both reversible USB-C contacts.
// The named-trunk case adds the same endpoint declarations as UsbRouting.tsx.
const motorDataNets = [
  {
    name: "M1_USB_DP",
    hub: "U20.pin2",
    esd: ["D511.pin3", "D511.pin4"],
    connector: ["J8.A6", "J8.B6"],
    trunk: "M1_path_DP",
  },
  {
    name: "M1_USB_DM",
    hub: "U20.pin1",
    esd: ["D511.pin1", "D511.pin6"],
    connector: ["J8.A7", "J8.B7"],
    trunk: "M1_path_DM",
  },
] as const

test("real M1 USB channel: aggregate nets fail pair resolution; named trunks retain all branches", async () => {
  for (const namedTrunks of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={174}
        height={99}
        layers={4}
        routingDisabled
        schMaxTraceDistance={30}
      >
        <schematictext
          text="4-MOTOR USB-C MOTHERBOARD / M1 DATA CHANNEL"
          schX={0}
          schY={5}
          fontSize={0.45}
          anchor="center"
        />
        <schematictext
          text="Real U20 / D511 / J8 signal pins and imported footprints"
          schX={0}
          schY={4.3}
          fontSize={0.3}
          anchor="center"
        />
        <schematictext
          text="Each USB net has 5 terminals: hub + 2 ESD pads + 2 connector contacts"
          schX={0}
          schY={3.7}
          fontSize={0.28}
          anchor="center"
        />
        <chip
          name="U20"
          manufacturerPartNumber="USB2517I-JZX"
          footprint={<USB2517I_JZXFootprint />}
          pcbX={48}
          pcbY={-20}
          pcbRotation={90}
          schX={-6}
          schY={0}
          schWidth={2.4}
          pinLabels={{ pin1: "DN1_DM", pin2: "DN1_DP" }}
          schPinArrangement={{
            rightSide: { pins: ["pin2", "pin1"], direction: "top-to-bottom" },
          }}
        />
        <chip
          name="D511"
          manufacturerPartNumber="USBLC6-2SC6"
          footprint={<USBLC6_2SC6Footprint />}
          pcbX={24}
          pcbY={-36.65}
          pcbRotation={180}
          schX={0}
          schY={0}
          schWidth={2.4}
          pinLabels={{
            pin1: "DM_IN",
            pin3: "DP_IN",
            pin4: "DP_OUT",
            pin6: "DM_OUT",
          }}
          schPinArrangement={{
            leftSide: { pins: ["pin3", "pin1"], direction: "top-to-bottom" },
            rightSide: { pins: ["pin4", "pin6"], direction: "top-to-bottom" },
          }}
        />
        <chip
          name="J8"
          manufacturerPartNumber="USB4105-GF-A"
          footprint={<USB4105_GF_AFootprint />}
          pcbX={24}
          pcbY={-43.75}
          pcbRotation={0}
          schX={6}
          schY={0}
          schWidth={2.4}
          pinLabels={{ pin11: "B6", pin12: "A7", pin13: "A6", pin14: "B7" }}
          schPinArrangement={{
            leftSide: {
              pins: ["pin13", "pin11", "pin12", "pin14"],
              direction: "top-to-bottom",
            },
          }}
        />
        {motorDataNets.map(({ name, hub, esd, connector, trunk }) => (
          <group key={name}>
            {[hub, ...esd, ...connector].map((terminal, index) => (
              <trace
                key={terminal}
                name={`${name}_${index}`}
                from={terminal}
                to={`net.${name}`}
              />
            ))}
            {namedTrunks && (
              <trace
                name={trunk}
                from={hub}
                to={connector[0]}
                thickness={0.2}
              />
            )}
          </group>
        ))}
        <differentialpair
          name="M1_USB"
          positiveConnection={namedTrunks ? "M1_path_DP" : "M1_USB_DP_0"}
          negativeConnection={namedTrunks ? "M1_path_DM" : "M1_USB_DM_0"}
          maxLengthSkew={0.15}
          targetDifferentialImpedance={90}
          maxUncoupledLength={2}
        />
        <schematictext
          text={
            namedTrunks
              ? "CONTROL: explicitly select U20 -> J8.A6/A7 as the two paths"
              : "FAILURE: select the hub-to-net traces as the differential pair"
          }
          schX={0}
          schY={-3.2}
          fontSize={0.32}
          anchor="center"
          color={namedTrunks ? "blue" : "red"}
        />
        <schematictext
          text={
            namedTrunks
              ? "Router input resolves both named paths; ESD and duplicate contacts remain connected."
              : 'Router-input conversion throws: Could not find an SRJ connection for "M1_USB_DP_0"'
          }
          schX={0}
          schY={-3.9}
          fontSize={0.27}
          anchor="center"
        />
        <schematictext
          text={
            namedTrunks
              ? "This verifies pair selection only, not completed routing or USB compliance."
              : "The 5-terminal net exists, but cannot identify the intended two-endpoint path."
          }
          schX={0}
          schY={-4.5}
          fontSize={0.27}
          anchor="center"
        />
        <schematictext
          text="Signal-only extract: power, CC, other hub ports and the remaining motherboard are omitted."
          schX={0}
          schY={-5.2}
          fontSize={0.24}
          anchor="center"
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    for (const { name } of motorDataNets) {
      const net = circuit.db.source_net.getWhere({ name })!
      const signalPorts = new Set(
        circuit.db.source_trace
          .list()
          .filter((trace) =>
            trace.connected_source_net_ids?.includes(net.source_net_id),
          )
          .flatMap((trace) => trace.connected_source_port_ids),
      )
      // Both cases must retain every real signal terminal, including A/B
      // connector duplicates. Dropping branches must not make the control pass.
      expect(signalPorts.size).toBe(5)
      for (const source_port_id of signalPorts) {
        expect(circuit.db.pcb_port.getWhere({ source_port_id })).toBeDefined()
      }
    }
    const getRoutingInput = () =>
      getSimpleRouteJsonFromCircuitJson({
        db: circuit.db,
        subcircuitComponent: circuit.firstChild!,
      }).simpleRouteJson
    const pairWarnings = circuit.db.source_property_ignored_warning
      .list()
      .filter((warning) =>
        ["positiveConnection", "negativeConnection"].includes(
          warning.property_name,
        ),
      )

    if (namedTrunks) {
      expect(pairWarnings).toEqual([])
      const input = getRoutingInput()
      const trunkIds = motorDataNets.map(
        ({ trunk }) =>
          circuit.db.source_trace.getWhere({ name: trunk })!.source_trace_id,
      )
      expect(input.differentialPairs).toEqual([
        {
          connectionNames: [trunkIds[0], trunkIds[1]],
          lengthTolerance: 0.15,
          maxUncoupledLength: 2,
        },
      ])
      for (const sourceTraceId of trunkIds) {
        expect(
          input.connections.find(
            (connection) => connection.source_trace_id === sourceTraceId,
          )?.pointsToConnect,
        ).toHaveLength(2)
      }
    } else {
      expect(
        pairWarnings.map((warning) => warning.property_name).sort(),
      ).toEqual(["negativeConnection", "positiveConnection"])
      expect(getRoutingInput).toThrow(
        'Could not find an SRJ connection for trace name or port selector "M1_USB_DP_0"',
      )
    }
    await expect(circuit).toMatchSchematicSnapshot(
      import.meta.path.replace(
        ".test.tsx",
        namedTrunks ? "-named-trunks.test.tsx" : "-net-only.test.tsx",
      ),
      { grid: false, width: 1600, height: 1000 },
    )
  }
}, 30_000)
