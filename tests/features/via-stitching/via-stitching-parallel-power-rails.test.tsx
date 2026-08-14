import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { setupViaStitchingPhases } from "tests/fixtures/via-stitching"

const gndPourOutline = [
  { x: -6, y: -5 },
  { x: 6, y: -5 },
  { x: 6, y: 5 },
  { x: -6, y: 5 },
]

test("via stitching joins GND pours without modifying VM or signal routes", async () => {
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
      width="38mm"
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
      <net name="VM_RAIL" routingPhaseIndex={0} />
      <net name="GND" routingPhaseIndex={0} />
      <testpoint
        name="VM_CONNECTOR"
        footprintVariant="pad"
        padDiameter="2mm"
        layer="top"
        pcbX={-16}
        pcbY={-3}
      />
      <testpoint
        name="GND_CONNECTOR"
        footprintVariant="pad"
        padDiameter="2mm"
        layer="top"
        pcbX={-16}
        pcbY={3}
        connections={{ pin1: "net.GND" }}
      />
      <testpoint
        name="VM_TEST"
        footprintVariant="pad"
        padDiameter="1.2mm"
        layer="top"
        pcbX={-13}
        pcbY={-3}
        connections={{ pin1: "net.VM_RAIL" }}
      />
      <chip
        name="U_MOTOR"
        footprint="tssop20"
        pinLabels={{
          pin1: "VM",
          pin2: "GND",
          pin3: "ISENA",
          pin4: "ISENB",
          pin5: "AOUT",
          pin6: "BOUT",
        }}
        layer="bottom"
        pcbX={9}
        connections={{ GND: "net.GND" }}
      />
      <capacitor
        name="C_VM_BULK"
        capacitance="47uF"
        footprint="1206"
        pcbX={-2}
        pcbY={-7}
      />
      <capacitor
        name="C_VM_HF"
        capacitance="100nF"
        footprint="0603"
        layer="bottom"
        pcbX={3}
        pcbY={-7}
      />
      <resistor
        name="R_ISENSE_A"
        resistance="100m"
        footprint="2512"
        pcbX={8}
        pcbY={8}
      />
      <resistor
        name="R_ISENSE_B"
        resistance="100m"
        footprint="2512"
        pcbX={14}
        pcbY={-8}
      />
      <trace
        name="VM_FEED"
        from=".VM_CONNECTOR > .pin1"
        to=".U_MOTOR > .VM"
        thickness="0.8mm"
        routingPhaseIndex={0}
      />
      <trace
        name="GND_FEED"
        from=".GND_CONNECTOR > .pin1"
        to=".U_MOTOR > .GND"
        thickness="0.8mm"
        routingPhaseIndex={0}
      />
      <trace
        name="VM_BULK_DECOUPLING"
        from=".U_MOTOR > .VM"
        to=".C_VM_BULK > .pin1"
        thickness="0.5mm"
        routingPhaseIndex={0}
      />
      <trace
        name="VM_HF_DECOUPLING"
        from=".U_MOTOR > .VM"
        to=".C_VM_HF > .pin1"
        thickness="0.3mm"
        routingPhaseIndex={0}
      />
      <trace
        name="CURRENT_SENSE_A"
        from=".U_MOTOR > .ISENA"
        to=".R_ISENSE_A > .pin1"
        thickness="0.4mm"
        routingPhaseIndex={0}
      />
      <trace
        name="CURRENT_SENSE_B"
        from=".U_MOTOR > .ISENB"
        to=".R_ISENSE_B > .pin1"
        thickness="0.4mm"
        routingPhaseIndex={0}
      />

      <autoroutingphase name="route-power" phaseIndex={0} />
      <autoroutingphase
        name="stitch-ground"
        phaseIndex={1}
        reroute
        region={{ minX: -19, maxX: 19, minY: -14, maxY: 14 }}
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
        text="TSSOP-20 driver: routed VM/signals + stitched GND pours"
        fontSize="0.45mm"
        pcbY={12.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const result = stitching.getResult()
  expect(result.completedPhaseNames).toEqual(["route-power", "stitch-ground"])
  expect(result.routedTraceCount).toBeGreaterThanOrEqual(2)
  expect(result.modifiedRoutedTraceCount).toBe(0)
  expect(result.stitchedRegionCount).toBe(1)
  expect(result.placedRegionViaCount).toBeGreaterThanOrEqual(8)
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
