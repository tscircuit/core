import { expect, test } from "bun:test"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("LED fabrication symbol follows polarity ports and preserves authored notes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={12} routingDisabled>
      <resistor name="R5" resistance="330" footprint="0402" pcbY={3} />
      <led
        name="LED1"
        footprint="0603"
        pinLabels={{ pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }}
      >
        <fabricationnotetext text="USER NOTE" pcbY={-3} fontSize={0.5} />
      </led>
      <trace from="R5.pin2" to="LED1.anode" />
      <trace from="LED1.cathode" to="net.RETURN" />
      <trace from="net.RETURN" to="net.GND" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const led = circuit.selectOne("led") as Led
  const filter = { pcb_component_id: led.pcb_component_id! }
  const notes = circuit.db.pcb_fabrication_note_text.list(filter)
  expect(notes.map((note) => note.text)).toEqual(["USER NOTE"])
  const paths = circuit.db.pcb_fabrication_note_path.list(filter)
  expect(paths[0]!.route[0]!.x).toBeGreaterThan(paths[3]!.route[1]!.x)
  expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(4)
  led.updatePcbComponentSizeCalculation()
  expect(circuit.db.pcb_fabrication_note_text.list(filter)).toHaveLength(1)
  expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(4)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
