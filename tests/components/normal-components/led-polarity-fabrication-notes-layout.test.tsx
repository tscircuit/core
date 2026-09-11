import { expect, test } from "bun:test"
import { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("LED fabrication annotations do not change emitted PCB layout", async () => {
  const render = async (withNotes: boolean) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <group pack pcbX={5} pcbY={3}>
          <resistor name="R1" resistance="330" footprint="0402" />
          <led name="LED1" footprint="0603" />
          <trace from="R1.pin2" to="LED1.anode" />
          <trace from="LED1.cathode" to="net.GND" />
        </group>
      </board>,
    )
    if (!withNotes) {
      const led = circuit.selectOne("led") as Led
      // Use the inherited render phase to compare the same design without notes.
      led.doInitialPcbComponentSizeCalculation = () =>
        NormalComponent.prototype.doInitialPcbComponentSizeCalculation.call(led)
    }
    await circuit.renderUntilSettled()
    if (withNotes) {
      const led = circuit.selectOne("led") as Led
      const paths = circuit.db.pcb_fabrication_note_path.list({
        pcb_component_id: led.pcb_component_id!,
      })
      const sourcePorts = circuit.db.source_port.list({
        source_component_id: led.source_component_id!,
      })
      for (const [hint, point] of [
        ["anode", paths[0]!.route[0]!],
        ["cathode", paths[3]!.route[1]!],
      ] as const) {
        const source = sourcePorts.find((port) =>
          port.port_hints?.includes(hint),
        )!
        const port = circuit.db.pcb_port.getWhere({
          source_port_id: source.source_port_id,
        })!
        expect(point.x).toBeCloseTo(port.x, 6)
        expect(point.y).toBeCloseTo(port.y, 6)
      }
    }
    return circuit
      .getCircuitJson()
      .filter(
        (element) =>
          element.type.startsWith("pcb_") &&
          !element.type.startsWith("pcb_fabrication_note_"),
      )
  }
  expect(await render(true)).toEqual(await render(false))
})
