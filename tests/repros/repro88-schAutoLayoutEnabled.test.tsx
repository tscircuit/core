import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("repro87: schAutoLayoutEnabled should not disable the autolayout of groups which are not having explicit position", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="200mm"
      height="150mm"
      routingDisabled={true}
      schAutoLayoutEnabled={true}
    >
      {/* explicitly positioned group */}
      <group name="G1" schX={0} schY={10}>
        <resistor name="R5" resistance="30" footprint="0603" />
        <capacitor name="C5" capacitance="10nF" footprint="0603" />
        <trace from="net.PWR" to=".R5 > .pin1" />
        <trace from=".R5 > .pin2" to="net.BAT_FILT" />
        <trace from="net.BAT_FILT" to=".C5 > .pin1" />
        <trace from=".C5 > .pin2" to="net.GND" />
      </group>
      {/* unpositioned children */}
      <resistor name="R3" resistance="100" footprint="0603" />
      <resistor name="R4" resistance="200" footprint="0603" />
      <capacitor name="C1" capacitance="0.22uF" footprint="0603" />
      <trace from="net.PWR" to=".R4 > .pin2" />
      <trace from=".R4 > .pin1" to=".R3 > .pin2" />
      <trace from=".R3 > .pin1" to=".Q1 > .pin2" /> {/* Collector */}
      <trace from=".Q1 > .pin2" to=".C1 > .pin1" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".Q1 > .pin1" to="net.NPNB" /> {/* Base */}
      <trace from=".Q1 > .pin3" to="net.LDOIN" /> {/* Emitter */}
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
