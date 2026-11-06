import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import {
  USB2517I_JZXFootprint,
  USB4105_GF_AFootprint,
  USBLC6_2SC6Footprint,
} from "tests/fixtures/four-motor-usbc-footprints"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Extracted from the current 4-Motor USB-C motherboard: UsbRouting.tsx,
// UsbDataSystem.tsx, MotorDataPorts.tsx, parts.tsx and placement.json.
// The native router routes the two named trunks. All four signal terminals
// per net remain declared; their branches and power nets are deferred to phase 1.
// No supplied copper, pcbPath, trace hints, custom router or production changes.
// Placements are board-world points in mm: +X right, +Y up, +Z above (right-handed).
test("reproduces M1 USB length skew after native PCB routing", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const inputs: SimpleRouteJson[] = []
  const outputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", ({ simpleRouteJson }) =>
    inputs.push(structuredClone(simpleRouteJson)),
  )
  circuit.on("autorouting:end", ({ simpleRouteJson }) =>
    outputs.push(structuredClone(simpleRouteJson)),
  )
  circuit.add(
    <board
      width={174}
      height={99}
      layers={4}
      isViaInPadAllowed
      minTraceWidth={0.15}
      minViaHoleDiameter={0.3}
      minViaPadDiameter={0.6}
      minTraceToPadEdgeClearance={0.15}
      minPadEdgeToPadEdgeClearance={0.15}
      minBoardEdgeClearance={0.25}
      routeRemaining={false}
      autorouter="auto_local"
      autorouterVersion="beta_pipeline9"
    >
      <autoroutingphase
        name="USB_TRUNKS"
        phaseIndex={0}
        autorouter="auto_local"
      />
      <trace
        routingPhaseIndex={0}
        name="M1_path_DP"
        from="U20.pin2"
        to="J8.A6"
        thickness={0.2}
      />
      <trace
        routingPhaseIndex={0}
        name="M1_path_DM"
        from="U20.pin1"
        to="J8.A7"
        thickness={0.2}
      />
      <differentialpair
        name="M1_USB"
        positiveConnection="M1_path_DP"
        negativeConnection="M1_path_DM"
        maxLengthSkew={0.15}
        targetDifferentialImpedance={90}
        maxUncoupledLength={2}
      />
      <chip
        name="U20"
        manufacturerPartNumber="USB2517I-JZX"
        footprint={<USB2517I_JZXFootprint />}
        pcbX={48}
        pcbY={-20}
        pcbRotation={90}
        pinLabels={{ pin1: "DN1_DM", pin2: "DN1_DP" }}
      />
      <chip
        name="D511"
        manufacturerPartNumber="USBLC6-2SC6"
        footprint={<USBLC6_2SC6Footprint />}
        pcbX={24}
        pcbY={-36.65}
        pcbRotation={180}
        pinLabels={{
          pin1: "DM_IN",
          pin2: "GND",
          pin3: "DP_IN",
          pin4: "DP_OUT",
          pin5: "VBUS",
          pin6: "DM_OUT",
        }}
        internallyConnectedPins={[
          ["pin1", "pin6"],
          ["pin3", "pin4"],
        ]}
      />
      <connector
        name="J8"
        manufacturerPartNumber="USB4105-GF-A"
        footprint={<USB4105_GF_AFootprint />}
        pcbX={24}
        pcbY={-43.75}
        pinLabels={{ pin11: "B6", pin12: "A7", pin13: "A6", pin14: "B7" }}
      />
      {[
        {
          net: "M1_USB_DP",
          ports: ["U20.pin2", "D511.pin3", "J8.A6", "J8.B6"],
        },
        {
          net: "M1_USB_DM",
          ports: ["U20.pin1", "D511.pin1", "J8.A7", "J8.B7"],
        },
        {
          net: "GND",
          ports: [
            "D511.pin2",
            ...[
              "pin1",
              "pin2",
              "pin3",
              "pin4",
              "pin5",
              "pin6",
              "pin19",
              "pin20",
            ].map((p) => `J8.${p}`),
          ],
        },
        {
          net: "USB1_VBUS",
          ports: [
            "D511.pin5",
            ...["pin7", "pin8", "pin17", "pin18"].map((p) => `J8.${p}`),
          ],
        },
      ].flatMap(({ net, ports }) =>
        ports.map((from) => (
          <trace
            routingPhaseIndex={1}
            key={from}
            from={from}
            to={`net.${net}`}
            thickness={0.2}
          />
        )),
      )}

      <pcbnotetext
        pcbX={36.5}
        pcbY={-10}
        fontSize={0.85}
        text="M1 USB: native router misses length limit"
      />
      <pcbnotetext
        pcbX={36.5}
        pcbY={-11.7}
        fontSize={0.55}
        text="Real motherboard U20 / D511 / J8 footprints and placement"
      />
      <pcbnotetext pcbX={29} pcbY={-19} fontSize={0.65} text="D+ = 33.31 mm" />
      <pcbnotetext
        pcbX={29}
        pcbY={-20.5}
        fontSize={0.65}
        text="D- = 31.94 mm"
      />
      <pcbnotetext
        pcbX={29}
        pcbY={-22}
        fontSize={0.65}
        text="Difference = 1.37 mm"
      />
      <pcbnotetext
        pcbX={29}
        pcbY={-24}
        fontSize={0.65}
        text="Allowed difference: 0.15 mm"
      />
      <pcbnotetext
        pcbX={29}
        pcbY={-26}
        fontSize={0.5}
        text="Expected: tune the shorter route to meet the limit"
      />
      <pcbnotetext pcbX={41} pcbY={-34} fontSize={0.6} text="D+" />
      <pcbnotetext pcbX={35} pcbY={-30.5} fontSize={0.6} text="D-" />
      <pcbnotetext pcbX={48} pcbY={-14.5} fontSize={0.6} text="U20 USB hub" />
      <pcbnotetext pcbX={24} pcbY={-34.5} fontSize={0.55} text="D511 ESD" />
      <pcbnotetext pcbX={24} pcbY={-48} fontSize={0.55} text="J8 M1 USB-C" />
      <pcbnotetext
        pcbX={37}
        pcbY={-49.5}
        fontSize={0.48}
        text="USB trunks only; ESD, duplicate contacts and power branches remain pending"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.source_property_ignored_warning.list()).toEqual([])
  expect(inputs).toHaveLength(1)
  expect(outputs).toHaveLength(1)
  const input = inputs[0]!
  expect(
    input.connections.map(({ pointsToConnect }) => pointsToConnect.length),
  ).toEqual([2, 2])
  const trunkNames = ["M1_path_DP", "M1_path_DM"]
  const trunkIds = trunkNames.map(
    (name) => circuit.db.source_trace.getWhere({ name })!.source_trace_id,
  )
  expect(input.differentialPairs).toEqual([
    {
      connectionNames: [trunkIds[0]!, trunkIds[1]!],
      lengthTolerance: 0.15,
      maxUncoupledLength: 2,
    },
  ])
  const traces = trunkIds.map(
    (source_trace_id) => circuit.db.pcb_trace.getWhere({ source_trace_id })!,
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  // Both published routes stay on top: the skew is not via-length accounting.
  const planarLength = (
    route: PcbTrace["route"] | SimplifiedPcbTrace["route"],
  ) =>
    route.slice(1).reduce((length, point, i) => {
      const previous = route[i]!
      if (
        point.route_type !== "wire" ||
        previous.route_type !== "wire" ||
        point.layer !== "top" ||
        previous.layer !== "top"
      )
        throw new Error("Expected surface USB routes")
      return length + Math.hypot(point.x - previous.x, point.y - previous.y)
    }, 0)
  const [positiveLength, negativeLength] = traces.map((trace) =>
    planarLength(trace.route),
  )
  expect(positiveLength!).toBeCloseTo(33.31, 2)
  expect(negativeLength!).toBeCloseTo(31.94, 2)
  // The same mismatch is already present in native router output, before core
  // publishes the routes. Core correctly reports it as a length-skew error.
  const routerLengths = outputs[0]!
    .traces!.map((trace) => planarLength(trace.route))
    .sort((a, b) => a - b)
  expect(routerLengths[0]!).toBeCloseTo(negativeLength!, 6)
  expect(routerLengths[1]!).toBeCloseTo(positiveLength!, 6)
  const [skewError] = circuit.db.pcb_bus_length_skew_error.list()
  expect(circuit.db.pcb_bus_length_skew_error.list()).toHaveLength(1)
  expect(skewError!.actual_length_skew).toBeCloseTo(
    positiveLength! - negativeLength!,
    6,
  )
  expect(skewError!.actual_length_skew).toBeGreaterThan(
    skewError!.maximum_length_skew,
  )
  expect(skewError!.maximum_length_skew).toBe(0.15)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 1300,
    viewport: { minX: 17, minY: -51, maxX: 56, maxY: -8 },
    backgroundColor: "white",
    shouldDrawRatsNest: false,
    // Pending phase-1 nets have expected connectivity errors, unrelated to skew.
    shouldDrawErrors: false,
    showPcbGroups: false,
    showDebugObjects: false,
  })
}, 30_000)
