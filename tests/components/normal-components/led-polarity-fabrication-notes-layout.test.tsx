import { expect, test } from "bun:test"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("implicit LED sizes and explicit diode footprints have the same packed PCB output", async () => {
  const render = async (footprint: string) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <group pack pcbX={5} pcbY={3}>
          <resistor name="R1" resistance="330" footprint="0402" />
          <led name="LED1" footprint={footprint} />
          <trace from="R1.pin2" to="LED1.anode" />
          <trace from="LED1.cathode" to="net.GND" />
        </group>
      </board>,
    )
    await circuit.renderUntilSettled()
    const led = circuit.selectOne("led") as Led
    expect(led.props.footprint).toBe(footprint)
    expect(led.resolveFootprint()).toBe("diode0603")
    const filter = { pcb_component_id: led.pcb_component_id! }
    expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(4)
    expect(circuit.db.pcb_fabrication_note_text.list(filter)).toHaveLength(2)
    return circuit.getCircuitJson().filter((e) => e.type.startsWith("pcb_"))
  }
  expect(await render("0603")).toEqual(await render("diode0603"))
})
