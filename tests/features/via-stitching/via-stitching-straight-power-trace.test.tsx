import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { setupViaStitchingPhases } from "tests/fixtures/via-stitching"

test("via stitching expands a straight power trace after routing", async () => {
  const { circuit } = getTestFixture()
  const stitching = setupViaStitchingPhases({
    circuit,
    routedPhaseName: "route-power",
    powerTraceRequirements: [
      {
        traceName: "VIN_POWER",
        currentAmps: 5,
        maxTemperatureRiseC: 1,
      },
    ],
  })

  circuit.add(
    <board
      width="34mm"
      height="24mm"
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
      <testpoint
        name="VIN_CONNECTOR"
        footprintVariant="pad"
        padDiameter="2mm"
        layer="top"
        pcbX={-14}
      />
      <chip
        name="U_BUCK"
        footprint="soic8"
        pinLabels={{
          pin1: "VIN",
          pin2: "GND",
          pin3: "SW",
          pin4: "FB",
          pin5: "EN",
          pin6: "VOUT",
          pin7: "BOOT",
          pin8: "BIAS",
        }}
        layer="bottom"
        pcbX={8}
      />
      <capacitor
        name="C_IN"
        capacitance="22uF"
        footprint="1206"
        pcbX={-5}
        pcbY={-5}
      />
      <capacitor
        name="C_BOOT"
        capacitance="100nF"
        footprint="0603"
        layer="bottom"
        pcbX={3}
        pcbY={5}
      />
      <resistor
        name="R_FB_TOP"
        resistance="100k"
        footprint="0805"
        pcbX={11}
        pcbY={5}
      />
      <resistor
        name="R_FB_BOTTOM"
        resistance="20k"
        footprint="0402"
        pcbX={13}
        pcbY={-5}
      />
      <trace
        name="VIN_POWER"
        from=".VIN_CONNECTOR > .pin1"
        to=".U_BUCK > .VIN"
        thickness="2mm"
        routingPhaseIndex={0}
      />
      <trace
        name="INPUT_DECOUPLING"
        from=".U_BUCK > .VIN"
        to=".C_IN > .pin1"
        thickness="0.5mm"
        routingPhaseIndex={0}
      />
      <trace
        name="BOOTSTRAP"
        from=".U_BUCK > .BOOT"
        to=".C_BOOT > .pin1"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />
      <trace
        name="FEEDBACK_TOP"
        from=".U_BUCK > .FB"
        to=".R_FB_TOP > .pin1"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />
      <trace
        name="FEEDBACK_DIVIDER"
        from=".R_FB_TOP > .pin2"
        to=".R_FB_BOTTOM > .pin1"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />

      <autoroutingphase name="route-power" phaseIndex={0} />
      <autoroutingphase
        name="stitch-power"
        phaseIndex={1}
        reroute
        region={{ minX: -17, maxX: 17, minY: -12, maxY: 12 }}
        autorouter={{ algorithmFn: stitching.addViaStitching }}
      />

      <pcbnotetext
        text="SOIC-8 buck: 5A VIN / 1C rise / 3-via array"
        fontSize="0.45mm"
        pcbY={10.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const result = stitching.getResult()
  expect(result.completedPhaseNames).toEqual(["route-power", "stitch-power"])
  expect(result.routedTraceCount).toBeGreaterThan(0)
  expect(result.wideTraceViaCount).toBeGreaterThan(0)
  expect(result.stitchedViaArrayCount).toBe(1)
  expect(result.addedViaCount).toBe(2)
  expect(result.insufficientArrayCapacityCount).toBe(0)
  expect(circuit.db.pcb_component.list().length).toBeGreaterThanOrEqual(6)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThanOrEqual(3)
  expect(
    circuit.db.pcb_trace
      .list()
      .filter(
        (trace) =>
          trace.route.length === 1 && trace.route[0]?.route_type === "via",
      ).length,
  ).toBeGreaterThanOrEqual(result.addedViaCount)
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_trace_clearance_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
