import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { setupViaStitchingPhases } from "tests/fixtures/via-stitching"

const vinRegionOutline = [
  { x: -6, y: -5 },
  { x: 6, y: -5 },
  { x: 6, y: 5 },
  { x: -6, y: 5 },
]

test("via stitching clips a VIN grid around a keepout", async () => {
  const { circuit } = getTestFixture()
  const stitching = setupViaStitchingPhases({
    circuit,
    routedPhaseName: "route-power",
    powerNetStitchingRegions: [
      {
        netName: "VIN_RAIL",
        outline: vinRegionOutline,
        pitch: 2,
        minimumViaCount: 8,
      },
    ],
  })

  circuit.add(
    <board
      width="40mm"
      height="28mm"
      layers={2}
      schematicDisabled
      minTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.1mm"
      minViaHoleDiameter="0.3mm"
      minViaPadDiameter="0.6mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <net name="VIN_RAIL" routingPhaseIndex={0} />
      <testpoint
        name="VIN"
        footprintVariant="pad"
        padDiameter="2mm"
        layer="top"
        pcbX={-17}
      />
      <testpoint
        name="VT"
        footprintVariant="pad"
        padDiameter="1.2mm"
        layer="top"
        pcbX={-5.5}
        pcbY={-4.3}
        connections={{ pin1: "net.VIN_RAIL" }}
      />
      <testpoint
        name="VB"
        footprintVariant="pad"
        padDiameter="1.2mm"
        layer="bottom"
        pcbX={5.5}
        pcbY={4.3}
        connections={{ pin1: "net.VIN_RAIL" }}
      />
      <chip
        name="U_REGULATOR"
        footprint="qfn32"
        pinLabels={{
          pin1: "VIN",
          pin2: "GND",
          pin3: "SW",
          pin4: "FB",
          pin5: "EN",
          pin6: "PGOOD",
        }}
        layer="bottom"
        pcbX={13}
      />
      <capacitor
        name="C_IN"
        capacitance="22uF"
        footprint="1206"
        pcbX={-9}
        pcbY={-8}
      />
      <inductor
        name="L1"
        inductance="4.7uH"
        footprint="1206"
        layer="bottom"
        pcbX={-5}
        pcbY={-9}
      />
      <capacitor
        name="C_OUT"
        capacitance="47uF"
        footprint="1206"
        pcbX={-12}
        pcbY={7}
      />
      <resistor
        name="R_FB"
        resistance="68k"
        footprint="0805"
        pcbX={17}
        pcbY={-8}
      />
      <keepout
        shape="rect"
        width="6mm"
        height="6mm"
        layers={["top", "bottom"]}
      />
      <trace
        name="VIN_FEED"
        from=".VIN > .pin1"
        to=".VT > .pin1"
        thickness="0.8mm"
        routingPhaseIndex={0}
      />
      <trace
        name="VIN_TO_REGULATOR"
        from=".VB > .pin1"
        to=".U_REGULATOR > .VIN"
        thickness="0.8mm"
        routingPhaseIndex={0}
      />
      <trace
        name="INPUT_DECOUPLING"
        from=".U_REGULATOR > .VIN"
        to=".C_IN > .pin1"
        thickness="0.5mm"
        routingPhaseIndex={0}
      />
      <trace
        name="SWITCH_NODE"
        from=".U_REGULATOR > .SW"
        to=".L1 > .pin1"
        thickness="0.8mm"
        routingPhaseIndex={0}
      />
      <trace
        name="OUTPUT_FILTER"
        from=".L1 > .pin2"
        to=".C_OUT > .pin1"
        thickness="0.8mm"
        routingPhaseIndex={0}
      />
      <trace
        name="FEEDBACK"
        from=".U_REGULATOR > .FB"
        to=".R_FB > .pin1"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />

      <autoroutingphase name="route-power" phaseIndex={0} />
      <autoroutingphase
        name="stitch-power"
        phaseIndex={1}
        reroute
        region={{ minX: -20, maxX: 20, minY: -14, maxY: 14 }}
        autorouter={{ algorithmFn: stitching.addViaStitching }}
      />

      <copperpour
        name="VIN_TOP_REGION"
        connectsTo="net.VIN_RAIL"
        layer="top"
        outline={vinRegionOutline}
        clearance="0.15mm"
      />
      <copperpour
        name="VIN_BOTTOM_REGION"
        connectsTo="net.VIN_RAIL"
        layer="bottom"
        outline={vinRegionOutline}
        clearance="0.15mm"
      />

      <pcbnotetext
        text="QFN-32 buck: stitched VIN region clipped by keepout"
        fontSize="0.45mm"
        pcbY={12.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const result = stitching.getResult()
  expect(result.completedPhaseNames).toEqual(["route-power", "stitch-power"])
  expect(result.routedTraceCount).toBeGreaterThan(0)
  expect(result.stitchedRegionCount).toBe(1)
  expect(result.placedRegionViaCount).toBeGreaterThanOrEqual(8)
  expect(result.rejectedRegionCandidateCount).toBeGreaterThan(0)
  expect(result.insufficientRegionCapacityCount).toBe(0)
  expect(circuit.db.pcb_component.list().length).toBeGreaterThanOrEqual(8)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThanOrEqual(8)
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
