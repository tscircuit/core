import { expect, test } from "bun:test"
import { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"
import type { Diode } from "lib/components/normal-components/Diode"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("diode fabrication notes do not change packed copper or connectivity", async () => {
  const render = async (withNotes: boolean) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <group pack pcbX={5} pcbY={3}>
          <resistor name="R1" resistance="1k" footprint="0402" />
          <diode
            name="D1"
            manufacturerPartNumber="PMEG6020ELRX"
            footprint="smdpads2_p3.3848mm_pw0.95mm_ph1.15mm"
            pinLabels={{ pin1: ["cathode"], pin2: ["anode"] }}
          />
          <trace name="SERIES" from="R1.pin2" to="D1.anode" />
          <trace name="RETURN" from="D1.cathode" to="net.GND" />
        </group>
      </board>,
    )
    if (!withNotes) {
      const diode = circuit.selectOne(".D1") as Diode
      diode.doInitialPcbComponentSizeCalculation = () =>
        NormalComponent.prototype.doInitialPcbComponentSizeCalculation.call(
          diode,
        )
    }
    await circuit.renderUntilSettled()
    if (withNotes) {
      const diode = circuit.selectOne(".D1") as Diode
      const ports = circuit.db.source_port.list({
        source_component_id: diode.source_component_id!,
      })
      const labels = circuit.db.pcb_fabrication_note_text.list({
        pcb_component_id: diode.pcb_component_id!,
      })
      for (const [text, name] of [
        ["+", "anode"],
        ["-", "cathode"],
      ] as const) {
        const port = circuit.db.pcb_port.getWhere({
          source_port_id: ports.find((port) => port.name === name)!
            .source_port_id,
        })!
        const label = labels.find((label) => label.text === text)!
        expect(label.anchor_position.x).toBeCloseTo(port.x, 6)
        expect(label.anchor_position.y).toBeCloseTo(port.y, 6)
      }
      expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
    return circuit
      .getCircuitJson()
      .filter(
        (element) =>
          [
            "source_component",
            "source_port",
            "source_trace",
            "source_net",
            "source_component_internal_connection",
          ].includes(element.type) ||
          (element.type.startsWith("pcb_") &&
            !element.type.startsWith("pcb_fabrication_note_")),
      )
  }
  expect(await render(true)).toEqual(await render(false))
})
