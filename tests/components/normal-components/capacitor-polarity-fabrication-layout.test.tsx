import { expect, test } from "bun:test"
import type { Capacitor } from "lib/components/normal-components/Capacitor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("implicit and explicit polarized capacitor footprints have the same packed PCB output", async () => {
  const render = async (footprint: string) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <group pack pcbX={5} pcbY={3}>
          <resistor name="R1" resistance="100" footprint="0402" />
          <capacitor
            name="C1"
            capacitance="10uF"
            polarized
            footprint={footprint}
          />
          <trace from="R1.pin2" to="C1.pos" />
        </group>
      </board>,
    )
    await circuit.renderUntilSettled()
    const capacitor = circuit.selectOne(".C1") as Capacitor
    expect(capacitor.props.footprint).toBe(footprint)
    expect(capacitor.resolveFootprint()).toBe("cap1206_polarized")
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
    return circuit.getCircuitJson().filter((e) => e.type.startsWith("pcb_"))
  }
  expect(await render("1206")).toEqual(await render("cap1206_polarized"))
})
