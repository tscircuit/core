import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("decoupler plane fanout joins retained ground copper", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(
    <board
      width="22mm"
      height="16mm"
      layers={4}
      autorouter="default"
      autorouterVersion="beta_pipeline9"
      allowBlindAndBuriedVias={false}
      isViaInPadAllowed={false}
      minTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.15mm"
      minViaPadDiameter="0.6mm"
      minViaHoleDiameter="0.3mm"
    >
      <net name="GND" isGroundNet />
      <net name="VDD_3V3" isPowerNet />
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
      <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={-3} />
      <capacitor name="C2" capacitance="100nF" footprint="0603" pcbX={3} />
      <trace
        name="GROUND_STITCH"
        from="C1.pin2"
        to="net.GND"
        routingPhaseIndex={0}
      />
      <breakoutpoint connection="C1.pin2" pcbX={0} pcbY={-5} />
      <trace
        name="C1_RETURN"
        from="C1.pin2"
        to="net.GND"
        routingPhaseIndex={1}
      />
      <trace
        name="C2_RETURN"
        from="C2.pin2"
        to="net.GND"
        routingPhaseIndex={1}
      />
      <autoroutingphase
        name="DECOUPLER_RETURNS"
        phaseIndex={1}
        autorouter="fanout"
        fanoutRoutingLayers={["top", "inner1", "inner2", "bottom"]}
        fanoutPourNetMap={{ inner1: "GND" }}
      />
      <trace from="C1.pin1" to="net.VDD_3V3" />
      <trace from="C2.pin1" to="net.VDD_3V3" />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(4)
  expect(circuit.db.pcb_via.list()).toHaveLength(3)
  for (const via of circuit.db.pcb_via.list()) {
    expect(via.layers).toEqual(["top", "inner1", "inner2", "bottom"])
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
