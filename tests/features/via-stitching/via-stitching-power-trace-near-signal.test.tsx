import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { setupViaStitchingPhases } from "tests/fixtures/via-stitching"

const gndPourOutline = [
  { x: -5, y: -2.5 },
  { x: 5, y: -2.5 },
  { x: 5, y: 3.5 },
  { x: -5, y: 3.5 },
]

test("GND-pour via stitching clips its grid around control routing", async () => {
  const { circuit } = getTestFixture()
  const stitching = setupViaStitchingPhases({
    circuit,
    routedPhaseName: "route-board",
    copperPourStitchingRegions: [
      {
        netName: "GND",
        outline: gndPourOutline,
        pitch: 2,
        minimumViaCount: 6,
      },
    ],
  })

  circuit.add(
    <board
      width="38mm"
      height="26mm"
      layers={2}
      schematicDisabled
      minTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.15mm"
      minViaEdgeToPadEdgeClearance="0.15mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.15mm"
      minViaHoleDiameter="0.3mm"
      minViaPadDiameter="0.6mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <net name="VCC_STITCH" routingPhaseIndex={0} />
      <net name="GND" routingPhaseIndex={0} />
      <testpoint
        name="VCC_IN"
        footprintVariant="pad"
        padDiameter="2mm"
        layer="top"
        pcbX={-16}
        pcbY={-3}
      />
      <testpoint
        name="GND_TEST"
        footprintVariant="pad"
        padDiameter="1.6mm"
        layer="top"
        pcbX={-16}
        pcbY={7}
        connections={{ pin1: "net.GND" }}
      />
      <chip
        name="U_LOAD_SWITCH"
        footprint="sot23"
        pinLabels={{ pin1: "VIN", pin2: "VOUT", pin3: "EN" }}
        layer="bottom"
        pcbX={8}
        pcbY={-3}
      />
      <testpoint
        name="SIGNAL_IN"
        footprintVariant="pad"
        padDiameter="1mm"
        layer="top"
        pcbX={-16}
        pcbY={3}
      />
      <capacitor
        name="C_IN"
        capacitance="10uF"
        footprint="1206"
        pcbX={-5}
        pcbY={-8}
      />
      <capacitor
        name="C_OUT"
        capacitance="22uF"
        footprint="1206"
        layer="bottom"
        pcbX={11}
        pcbY={-8}
      />
      <resistor
        name="R_EN"
        resistance="100k"
        footprint="0603"
        pcbX={1}
        pcbY={7}
      />
      <resistor
        name="R_SENSE"
        resistance="10k"
        footprint="0805"
        pcbX={12}
        pcbY={7}
      />
      <trace
        name="VCC_FEED"
        from=".VCC_IN > .pin1"
        to=".U_LOAD_SWITCH > .VIN"
        thickness="0.8mm"
        routingPhaseIndex={0}
      />
      <trace
        name="ENABLE_SIGNAL"
        from=".SIGNAL_IN > .pin1"
        to=".U_LOAD_SWITCH > .EN"
        thickness="0.2mm"
        routingPhaseIndex={0}
      />
      <trace
        name="INPUT_DECOUPLING"
        from=".U_LOAD_SWITCH > .VIN"
        to=".C_IN > .pin1"
        thickness="0.5mm"
        routingPhaseIndex={0}
      />
      <trace
        name="OUTPUT_DECOUPLING"
        from=".U_LOAD_SWITCH > .VOUT"
        to=".C_OUT > .pin1"
        thickness="0.8mm"
        routingPhaseIndex={0}
      />
      <trace
        name="ENABLE_PULLUP"
        from=".U_LOAD_SWITCH > .EN"
        to=".R_EN > .pin1"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />
      <trace
        name="OUTPUT_SENSE"
        from=".U_LOAD_SWITCH > .VOUT"
        to=".R_SENSE > .pin1"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />
      <trace
        name="SENSE_GROUND"
        from=".R_SENSE > .pin2"
        to="net.GND"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />

      <autoroutingphase name="route-board" phaseIndex={0} />
      <autoroutingphase
        name="stitch-ground"
        phaseIndex={1}
        reroute
        region={{ minX: -19, maxX: 19, minY: -13, maxY: 13 }}
        autorouter={{ algorithmFn: stitching.addViaStitching }}
      />

      <copperpour
        name="GND_TOP_POUR"
        connectsTo="net.GND"
        layer="top"
        outline={gndPourOutline}
        clearance="0.15mm"
      />
      <copperpour
        name="GND_BOTTOM_POUR"
        connectsTo="net.GND"
        layer="bottom"
        outline={gndPourOutline}
        clearance="0.15mm"
      />

      <pcbnotetext
        text="SOT-23 switch: routed traces + stitched GND pours"
        fontSize="0.45mm"
        pcbY={11.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const result = stitching.getResult()
  expect(result.completedPhaseNames).toEqual(["route-board", "stitch-ground"])
  expect(result.routedTraceCount).toBeGreaterThanOrEqual(2)
  expect(result.modifiedRoutedTraceCount).toBe(0)
  expect(result.stitchedRegionCount).toBe(1)
  expect(result.placedRegionViaCount).toBeGreaterThanOrEqual(6)
  expect(result.rejectedRegionCandidateCount).toBeGreaterThan(0)
  expect(result.insufficientRegionCapacityCount).toBe(0)
  expect(circuit.db.pcb_component.list().length).toBeGreaterThanOrEqual(8)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThanOrEqual(6)
  expect(
    circuit.db.pcb_trace
      .list()
      .filter(
        (trace) =>
          trace.route.length === 1 && trace.route[0]?.route_type === "via",
      ).length,
  ).toBeGreaterThanOrEqual(result.placedRegionViaCount)
  expect(circuit.db.pcb_copper_pour.list().length).toBeGreaterThanOrEqual(2)
  const gndNet = circuit.db.source_net.list().find((net) => net.name === "GND")
  expect(gndNet).toBeDefined()
  expect(
    new Set(
      circuit.db.pcb_copper_pour
        .list()
        .filter((pour) => pour.source_net_id === gndNet?.source_net_id)
        .map((pour) => pour.layer),
    ),
  ).toEqual(new Set(["top", "bottom"]))
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_trace_clearance_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
