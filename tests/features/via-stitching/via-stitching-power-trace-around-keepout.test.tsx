import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { setupViaStitchingPhases } from "tests/fixtures/via-stitching"

const gndPourOutline = [
  { x: -6, y: -5 },
  { x: 6, y: -5 },
  { x: 6, y: 5 },
  { x: -6, y: 5 },
]

test("GND-pour via stitching clips its grid around a keepout", async () => {
  const { circuit } = getTestFixture()
  const stitching = setupViaStitchingPhases({
    circuit,
    routedPhaseName: "route-power",
    copperPourStitchingRegions: [
      {
        netName: "GND",
        outline: gndPourOutline,
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
      <net name="GND" routingPhaseIndex={0} />
      <testpoint
        name="VIN"
        footprintVariant="pad"
        padDiameter="2mm"
        layer="top"
        pcbX={-17}
      />
      <testpoint
        name="GND_TEST"
        footprintVariant="pad"
        padDiameter="1.6mm"
        layer="top"
        pcbX={-17}
        pcbY={5}
        connections={{ pin1: "net.GND" }}
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
        connections={{ GND: "net.GND" }}
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
      <trace
        name="FEEDBACK_GROUND"
        from=".R_FB > .pin2"
        to="net.GND"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />

      <autoroutingphase name="route-power" phaseIndex={0} />
      <autoroutingphase
        name="stitch-ground"
        phaseIndex={1}
        reroute
        region={{ minX: -20, maxX: 20, minY: -14, maxY: 14 }}
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
        text="QFN-32 buck: routed traces + stitched GND around keepout"
        fontSize="0.45mm"
        pcbY={12.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const result = stitching.getResult()
  expect(result.completedPhaseNames).toEqual(["route-power", "stitch-ground"])
  expect(result.routedTraceCount).toBeGreaterThan(0)
  expect(result.modifiedRoutedTraceCount).toBe(0)
  expect(result.stitchedRegionCount).toBe(1)
  expect(result.placedRegionViaCount).toBeGreaterThanOrEqual(8)
  expect(result.rejectedRegionCandidateCount).toBeGreaterThan(0)
  expect(result.insufficientRegionCapacityCount).toBe(0)
  expect(circuit.db.pcb_component.list().length).toBeGreaterThanOrEqual(7)
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
