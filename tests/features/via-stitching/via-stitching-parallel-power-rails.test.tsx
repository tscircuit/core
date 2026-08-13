import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { setupViaStitchingPhases } from "tests/fixtures/via-stitching"

test("via stitching expands a TSSOP motor driver power pair", async () => {
  const { circuit } = getTestFixture()
  const stitching = setupViaStitchingPhases({
    circuit,
    routedPhaseName: "route-power",
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
        name="VM_POWER"
        from=".VM_CONNECTOR > .pin1"
        to=".U_MOTOR > .VM"
        thickness="1.4mm"
        routingPhaseIndex={0}
      />
      <trace
        name="GND_POWER"
        from=".GND_CONNECTOR > .pin1"
        to=".U_MOTOR > .GND"
        thickness="1.4mm"
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
        name="stitch-power"
        phaseIndex={1}
        reroute
        region={{ minX: -19, maxX: 19, minY: -14, maxY: 14 }}
        autorouter={{ algorithmFn: stitching.addViaStitching }}
      />

      <pcbnotetext
        text="TSSOP-20 motor driver: stitched VM + GND rails"
        fontSize="0.45mm"
        pcbY={12.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const result = stitching.getResult()
  expect(result.completedPhaseNames).toEqual(["route-power", "stitch-power"])
  expect(result.routedTraceCount).toBeGreaterThanOrEqual(2)
  expect(result.wideTraceViaCount).toBeGreaterThanOrEqual(2)
  expect(result.stitchedViaArrayCount).toBeGreaterThanOrEqual(2)
  expect(result.addedViaCount).toBeGreaterThanOrEqual(2)
  expect(circuit.db.pcb_component.list().length).toBeGreaterThanOrEqual(7)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThanOrEqual(4)
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_trace_clearance_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
