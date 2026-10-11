import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("only local capacitor supply/return pairs inherit a decoupling rule", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={40} height={30} routingDisabled schematicDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pcbX={-8}
        pinLabels={{ 1: "VDD", 2: "GND", 3: "FB", 4: "VREF" }}
        pinAttributes={{
          VDD: { requiresPower: true },
          GND: { requiresGround: true },
        }}
      />
      <chip name="U2" footprint="soic8" pcbX={8} pinLabels={{ 2: "GND" }} />
      <chip name="J1" footprint="soic8" pinLabels={{ 1: "RD" }} />
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={-4} />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        pcbX={-1}
        maxDecouplingTraceLength={5.5}
      />
      <capacitor
        name="CB"
        capacitance="10uF"
        footprint="0603"
        pcbX={3}
        capacitorRole="bulk"
      />
      <capacitor
        name="CR"
        capacitance="10uF"
        footprint="0603"
        pcbX={6}
        capacitorRole="regulator_input"
      />
      <resistor name="R1" resistance="10k" footprint="0402" pcbY={5} />
      <trace name="LOCAL_SUPPLY" from=".C1 > .1" to=".U1 > .VDD" />
      <trace name="LOCAL_RETURN" from=".C1 > .2" to=".U1 > .GND" />
      <trace name="SUPPLY_BRIDGE" from=".C2 > .1" to=".C1 > .1" />
      <trace name="GROUND_BRIDGE" from=".C2 > .2" to=".C1 > .2" />
      <trace name="NET_RETURN" from=".C1 > .2" to="net.GND" />
      <trace name="WRONG_IC_RETURN" from=".C1 > .2" to=".U2 > .GND" />
      <trace name="PULLUP" from=".C1 > .1" to=".J1 > .RD" />
      <trace name="FEEDBACK" from=".C1 > .1" to=".U1 > .FB" />
      <trace name="REFERENCE" from=".C1 > .1" to=".U1 > .VREF" />
      <trace name="RESISTOR_LINK" from=".C1 > .1" to=".R1 > .1" />
      <trace
        name="EXPLICIT_BRIDGE"
        from=".C2 > .1"
        to=".R1 > .2"
        maxLength={2.5}
      />
      <trace name="BULK_SUPPLY" from=".CB > .1" to=".U1 > .VDD" maxLength={4} />
      <trace from=".CB > .2" to="net.GND" />
      <trace
        name="REGULATOR_SUPPLY"
        from=".CR > .1"
        to=".U1 > .VDD"
        maxLength={3}
      />
      <trace from=".CR > .2" to="net.GND" />
      <pcbnotetext
        text="Only C1 to U1 VDD/GND inherits 1mm; other roles keep authored limits"
        pcbY={-12}
        fontSize={0.55}
      />
    </board>,
  )
  circuit.render()
  const named = Object.fromEntries(
    circuit.db.source_trace
      .list()
      .filter((t) => t.name)
      .map((t) => [t.name!, t]),
  )
  for (const name of ["LOCAL_SUPPLY", "LOCAL_RETURN"]) {
    expect(named[name]!.max_length).toBe(1)
    expect(named[name]!.max_length_origin).toBe("inferred_decoupling")
    expect(named[name]!.capacitor_connection?.capacitor_role).toBe("decoupling")
  }
  for (const name of [
    "SUPPLY_BRIDGE",
    "GROUND_BRIDGE",
    "NET_RETURN",
    "WRONG_IC_RETURN",
    "PULLUP",
    "FEEDBACK",
    "REFERENCE",
    "RESISTOR_LINK",
  ]) {
    expect(named[name]!.max_length).toBeUndefined()
    expect(named[name]!.capacitor_connection).toBeUndefined()
  }
  for (const [name, maximum] of [
    ["EXPLICIT_BRIDGE", 2.5],
    ["BULK_SUPPLY", 4],
    ["REGULATOR_SUPPLY", 3],
  ] as const) {
    expect(named[name]!.max_length).toBe(maximum)
    expect(named[name]!.max_length_origin).toBe("explicit")
  }
  expect(named.BULK_SUPPLY!.capacitor_connection?.capacitor_role).toBe("bulk")
  expect(named.REGULATOR_SUPPLY!.capacitor_connection?.capacitor_role).toBe(
    "regulator_input",
  )
  for (const name of ["CB", "CR"]) {
    const capacitor = circuit.db.source_component
      .list()
      .find((c) => c.name === name)
    expect(
      capacitor?.ftype === "simple_capacitor" &&
        capacitor.max_decoupling_trace_length,
    ).toBeUndefined()
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
