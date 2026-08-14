import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { setupViaStitchingPhases } from "tests/fixtures/via-stitching"

test("via stitching expands a QFN hot-swap controller power trace", async () => {
  const { circuit } = getTestFixture()
  const stitching = setupViaStitchingPhases({
    circuit,
    routedPhaseName: "route-power",
    powerTraceRequirements: [
      {
        traceName: "BATTERY_POWER",
        currentAmps: 16,
        maxTemperatureRiseC: 5,
      },
    ],
  })

  circuit.add(
    <board
      width="36mm"
      height="26mm"
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
        name="BATTERY_POS"
        footprintVariant="pad"
        padDiameter="2mm"
        layer="top"
        pcbX={-15}
      />
      <chip
        name="U_HOTSWAP"
        footprint="qfn20"
        pinLabels={{
          pin1: "VIN",
          pin2: "GND",
          pin3: "VOUT",
          pin4: "SENSE",
          pin5: "TIMER",
          pin6: "EN",
        }}
        layer="bottom"
        pcbX={9}
      />
      <capacitor
        name="C_IN"
        capacitance="47uF"
        footprint="1206"
        pcbX={-5}
        pcbY={-6}
      />
      <resistor
        name="R_SENSE"
        resistance="20m"
        footprint="2512"
        pcbX={3}
        pcbY={6}
      />
      <capacitor
        name="C_TIMER"
        capacitance="10nF"
        footprint="0603"
        layer="bottom"
        pcbX={12}
        pcbY={6}
      />
      <resistor
        name="R_EN"
        resistance="100k"
        footprint="0805"
        pcbX={14}
        pcbY={-6}
      />
      <trace
        name="BATTERY_POWER"
        from=".BATTERY_POS > .pin1"
        to=".U_HOTSWAP > .VIN"
        thickness="3.4mm"
        routingPhaseIndex={0}
      />
      <trace
        name="INPUT_BULK"
        from=".U_HOTSWAP > .VIN"
        to=".C_IN > .pin1"
        thickness="0.6mm"
        routingPhaseIndex={0}
      />
      <trace
        name="CURRENT_SENSE"
        from=".U_HOTSWAP > .SENSE"
        to=".R_SENSE > .pin1"
        thickness="0.4mm"
        routingPhaseIndex={0}
      />
      <trace
        name="FAULT_TIMER"
        from=".U_HOTSWAP > .TIMER"
        to=".C_TIMER > .pin1"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />
      <trace
        name="ENABLE_PULLUP"
        from=".U_HOTSWAP > .EN"
        to=".R_EN > .pin1"
        thickness="0.25mm"
        routingPhaseIndex={0}
      />

      <autoroutingphase name="route-power" phaseIndex={0} />
      <autoroutingphase
        name="stitch-power"
        phaseIndex={1}
        reroute
        region={{ minX: -18, maxX: 18, minY: -13, maxY: 13 }}
        autorouter={{ algorithmFn: stitching.addViaStitching }}
      />

      <pcbnotetext
        text="QFN-20 hot-swap: 16A BAT+ / 5C rise / 4 vias"
        fontSize="0.45mm"
        pcbY={11.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const result = stitching.getResult()
  expect(result.completedPhaseNames).toEqual(["route-power", "stitch-power"])
  expect(result.routedTraceCount).toBeGreaterThan(0)
  expect(result.wideTraceViaCount).toBeGreaterThan(0)
  expect(result.stitchedViaArrayCount).toBe(1)
  expect(result.addedViaCount).toBe(3)
  expect(result.insufficientArrayCapacityCount).toBe(0)
  expect(circuit.db.pcb_component.list().length).toBeGreaterThanOrEqual(6)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThanOrEqual(4)
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
