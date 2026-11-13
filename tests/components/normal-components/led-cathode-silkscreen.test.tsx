import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cathode-first LED footprint marks the connected cathode pad on silkscreen", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={7} routingDisabled>
      <led
        name="D_PWR"
        footprint="led_p1.498mm_pw0.8mm_ph0.8mm"
        pinLabels={{ pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }}
        connections={{ cathode: "net.GND", anode: "net.VLED" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const cathode = circuit.db.source_port.getWhere({ name: "cathode" })!
  expect(cathode.pin_number).toBe(1)
  const cathodePort = circuit.db.pcb_port.getWhere({
    source_port_id: cathode.source_port_id,
  })!
  const cathodePad = circuit.db.pcb_smtpad.getWhere({
    pcb_port_id: cathodePort.pcb_port_id,
  })!
  const outline = circuit.db.pcb_silkscreen_path.getWhere({
    pcb_component_id: cathodePad.pcb_component_id,
  })!
  // The middle segment of the three-sided outline is the polarity bar.
  const [, barStart, barEnd] = outline.route
  expect(barStart!.x).toBe(barEnd!.x)
  expect(barStart!.x).toBeLessThan(cathodePort.x)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
