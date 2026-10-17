import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor limits belong to local IC connections, not every capacitor endpoint", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        maxDecouplingTraceLength="5.5mm"
      />
      <capacitor
        name="C2"
        capacitance="1uF"
        footprint="0402"
        maxDecouplingTraceLength="5.5mm"
      />
      <resistor name="R1" resistance="10k" footprint="0402" />
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ 1: "VDD", 2: "FB", 3: "EP", 4: "GND" }}
        pinAttributes={{
          VDD: { requiresPower: true },
          GND: { requiresGround: true },
          EP: { shouldHaveDecouplingCapacitor: false },
        }}
      />
      <trace name="LOCAL_SUPPLY" from=".C1 > .pin1" to=".U1 > .VDD" />
      <trace name="LOCAL_RETURN" from=".C1 > .pin2" to=".U1 > .GND" />
      <trace name="CAPACITOR_BRIDGE" from=".C1 > .pin1" to=".C2 > .pin1" />
      <trace name="FEEDBACK" from=".C2 > .pin1" to=".R1 > .pin1" />
      <trace name="EXPOSED_PAD" from=".C2 > .pin2" to=".U1 > .EP" />
      <trace name="UNTARGETED_NET" from=".C2 > .pin2" to="net.GND" />
      <trace
        name="EXPLICIT_BRIDGE"
        from=".C2 > .pin1"
        to=".R1 > .pin2"
        maxLength="5.5mm"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  const limits = Object.fromEntries(
    circuit.db.source_trace
      .list()
      .map((trace) => [trace.name, trace.max_length]),
  )
  expect(limits).toEqual({
    LOCAL_SUPPLY: 5.5,
    LOCAL_RETURN: 5.5,
    CAPACITOR_BRIDGE: undefined,
    FEEDBACK: undefined,
    EXPOSED_PAD: undefined,
    UNTARGETED_NET: undefined,
    EXPLICIT_BRIDGE: 5.5,
  })
})
