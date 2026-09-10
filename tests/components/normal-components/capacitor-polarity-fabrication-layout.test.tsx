import { expect, test } from "bun:test"
import { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"
import type { Capacitor } from "lib/components/normal-components/Capacitor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor signs follow packed layout without changing PCB geometry", async () => {
  const render = async (withSymbols: boolean) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <group pack pcbX={5} pcbY={3}>
          <resistor name="R1" resistance="100" footprint="0402" />
          <capacitor name="C1" capacitance="10uF" polarized footprint="1206" />
          <trace from="R1.pin2" to="C1.pos" />
        </group>
      </board>,
    )
    const capacitor = circuit.selectOne(".C1") as Capacitor
    if (!withSymbols) {
      capacitor.doInitialPcbComponentSizeCalculation = () =>
        NormalComponent.prototype.doInitialPcbComponentSizeCalculation.call(
          capacitor,
        )
    }
    await circuit.renderUntilSettled()
    if (withSymbols) {
      const paths = circuit.db.pcb_fabrication_note_path.list({
        pcb_component_id: capacitor.pcb_component_id!,
      })
      const ports = circuit.db.source_port.list({
        source_component_id: capacitor.source_component_id!,
      })
      const positive = circuit.db.pcb_port.getWhere({
        source_port_id: ports.find((p) => p.port_hints?.includes("pos"))!
          .source_port_id,
      })!
      const negative = circuit.db.pcb_port.getWhere({
        source_port_id: ports.find((p) => p.port_hints?.includes("neg"))!
          .source_port_id,
      })!
      for (const [path, pad, other] of [
        [paths[0]!, positive, negative],
        [paths[2]!, negative, positive],
      ] as const) {
        const x = (path.route[0]!.x + path.route[1]!.x) / 2
        const y = (path.route[0]!.y + path.route[1]!.y) / 2
        expect(x).toBeCloseTo(pad.x * 0.75 + other.x * 0.25)
        expect(y).toBeCloseTo(pad.y * 0.75 + other.y * 0.25)
      }
      expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
    return circuit
      .getCircuitJson()
      .filter(
        (e) =>
          e.type.startsWith("pcb_") &&
          !e.type.startsWith("pcb_fabrication_note_"),
      )
  }
  expect(await render(true)).toEqual(await render(false))
})
