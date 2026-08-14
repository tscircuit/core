import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { setupViaStitchingPhases } from "tests/fixtures/via-stitching"

const vccRegionOutline = [
  { x: -5, y: -2.5 },
  { x: 5, y: -2.5 },
  { x: 5, y: 3.5 },
  { x: -5, y: 3.5 },
]

test("via stitching clips a VCC grid around control routing", async () => {
  const { circuit } = getTestFixture()
  const stitching = setupViaStitchingPhases({
    circuit,
    routedPhaseName: "route-board",
    powerNetStitchingRegions: [
      {
        netName: "VCC_STITCH",
        outline: vccRegionOutline,
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
      <testpoint
        name="VCC_IN"
        footprintVariant="pad"
        padDiameter="2mm"
        layer="top"
        pcbX={-16}
        pcbY={-3}
      />
      <testpoint
        name="VCT"
        footprintVariant="pad"
        padDiameter="1.2mm"
        layer="top"
        pcbX={-4.5}
        pcbY={-2}
        connections={{ pin1: "net.VCC_STITCH" }}
      />
      <testpoint
        name="VCB"
        footprintVariant="pad"
        padDiameter="1.2mm"
        layer="bottom"
        pcbX={4.5}
        pcbY={-2}
        connections={{ pin1: "net.VCC_STITCH" }}
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
        to=".VCT > .pin1"
        thickness="0.8mm"
        routingPhaseIndex={0}
      />
      <trace
        name="VCC_TO_SWITCH"
        from=".VCB > .pin1"
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

      <autoroutingphase name="route-board" phaseIndex={0} />
      <autoroutingphase
        name="stitch-power"
        phaseIndex={1}
        reroute
        region={{ minX: -19, maxX: 19, minY: -13, maxY: 13 }}
        autorouter={{ algorithmFn: stitching.addViaStitching }}
      />

      <copperpour
        name="VCC_TOP_REGION"
        connectsTo="net.VCC_STITCH"
        layer="top"
        outline={vccRegionOutline}
        clearance="0.15mm"
      />
      <copperpour
        name="VCC_BOTTOM_REGION"
        connectsTo="net.VCC_STITCH"
        layer="bottom"
        outline={vccRegionOutline}
        clearance="0.15mm"
      />

      <pcbnotetext
        text="SOT-23 switch: VCC region clipped around EN routing"
        fontSize="0.45mm"
        pcbY={11.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const result = stitching.getResult()
  expect(result.completedPhaseNames).toEqual(["route-board", "stitch-power"])
  expect(result.routedTraceCount).toBeGreaterThanOrEqual(2)
  expect(result.stitchedRegionCount).toBe(1)
  expect(result.placedRegionViaCount).toBeGreaterThanOrEqual(6)
  expect(result.rejectedRegionCandidateCount).toBeGreaterThan(0)
  expect(result.insufficientRegionCapacityCount).toBe(0)
  expect(circuit.db.pcb_component.list().length).toBeGreaterThanOrEqual(9)
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
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_trace_clearance_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
