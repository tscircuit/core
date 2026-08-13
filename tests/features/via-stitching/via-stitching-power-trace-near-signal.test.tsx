import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { setupViaStitchingPhases } from "tests/fixtures/via-stitching"

test("via stitching keeps a SOT-23 load-switch rail clear of control routing", async () => {
  const { circuit } = getTestFixture()
  const stitching = setupViaStitchingPhases({
    circuit,
    routedPhaseName: "route-board",
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
      <testpoint
        name="VCC_IN"
        footprintVariant="pad"
        padDiameter="2mm"
        layer="top"
        pcbX={-16}
        pcbY={-3}
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
        name="VCC_POWER"
        from=".VCC_IN > .pin1"
        to=".U_LOAD_SWITCH > .VIN"
        thickness="1.6mm"
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

      <pcbnotetext
        text="SOT-23 load switch: stitched VCC beside EN signal"
        fontSize="0.45mm"
        pcbY={11.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const result = stitching.getResult()
  expect(result.completedPhaseNames).toEqual(["route-board", "stitch-power"])
  expect(result.routedTraceCount).toBeGreaterThanOrEqual(2)
  expect(result.wideTraceViaCount).toBeGreaterThan(0)
  expect(result.stitchedViaArrayCount).toBeGreaterThan(0)
  expect(result.addedViaCount).toBeGreaterThan(0)
  expect(circuit.db.pcb_component.list().length).toBeGreaterThanOrEqual(7)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThan(1)
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_trace_clearance_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
