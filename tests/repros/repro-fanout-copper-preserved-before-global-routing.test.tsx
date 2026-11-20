import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkHoleTraceClearance,
  checkPadTraceClearance,
} from "@tscircuit/checks"
import { pcb_trace } from "circuit-json"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("global routing preserves completed fanout copper", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  circuit.add(
    <board
      width={24}
      height={10}
      layers={2}
      minTraceWidth={0.1}
      defaultTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.1}
      minTraceToHoleEdgeClearance={0.1}
      minViaHoleDiameter={0.15}
      minViaPadDiameter={0.3}
    >
      <breakout
        name="CONTROLLER"
        pcbX={-5}
        width={6}
        height={4}
        fanoutRoutingLayers={["top", "bottom"]}
        busFanoutDirections={{
          DATA: "rightside_center",
          SERIAL: "rightside_center",
        }}
      >
        <chip name="U1" footprint="bga9_grid3x3_p0.8mm" />
      </breakout>
      <chip name="U2" footprint="bga9_grid3x3_p0.8mm" pcbX={5} />
      <trace name="DATA0" from="U1.pin1" to="U2.pin1" />
      <trace name="DATA1" from="U1.pin2" to="U2.pin2" />
      <trace name="DATA2" from="U1.pin3" to="U2.pin3" />
      <trace name="SCLK" from="U1.pin4" to="U2.pin4" />
      <trace name="MOSI" from="U1.pin6" to="U2.pin6" />
      <trace name="MISO" from="U1.pin7" to="U2.pin7" />
      <bus
        name="DATA"
        connections={["DATA0", "DATA1", "DATA2"]}
        preferredLayers={["top", "bottom"]}
      />
      <bus
        name="SERIAL"
        connections={["SCLK", "MOSI", "MISO"]}
        preferredLayers={["top", "bottom"]}
      />
      <pcbnotetext
        text="6-signal BGA link: native fanout, then global routing"
        pcbY={3.6}
        fontSize={0.3}
      />
      <pcbnotetext
        text="DATA + SERIAL: top/bottom | 0.1mm trace width and clearance"
        pcbY={3}
        fontSize={0.27}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const fanoutTraces = autoroutingPhaseIoStack[0]!.endSimpleRouteJson!.traces!
  expect(fanoutTraces).toHaveLength(6)
  for (const fanoutTrace of fanoutTraces) {
    expect(circuit.db.pcb_trace.get(fanoutTrace.pcb_trace_id)?.route).toEqual(
      pcb_trace.parse(fanoutTrace).route,
    )
  }
  expect(checkEachPcbTraceNonOverlapping(circuitJson)).toEqual([])
  expect(checkHoleTraceClearance(circuitJson)).toEqual([])
  expect(checkPadTraceClearance(circuitJson)).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    showDebugObjects: false,
    showPcbGroups: true,
  })
}, 120_000)
