import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("return contacts use the emitted PCB geometry on rotated and bottom-side components", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <ReturnCurrentBoard layer={layer} rotation={rotation}>
          <pcbreturncurrentsimulation>
            <pcbreturncurrentexcitation {...returnCurrentExcitationProps} />
          </pcbreturncurrentsimulation>
          <pcbnotetext
            text={`Contacts: ${layer}, ${rotation}°`}
            pcbY={-2.4}
            fontSize={0.4}
          />
        </ReturnCurrentBoard>,
      )
      await circuit.renderUntilSettled()
      const [excitation] =
        circuit.db.simulation_return_current_excitation.list()
      for (const contact of [
        excitation.return_source,
        excitation.return_sink,
      ]) {
        expect(contact.contact_type).toBe("pcb_port")
        if (contact.contact_type !== "pcb_port")
          throw new Error("Expected actual ground PCB port")
        const port = circuit.db.pcb_port.get(contact.pcb_port_id)!
        const pad = circuit.db.pcb_smtpad.list({
          pcb_port_id: port.pcb_port_id,
        })[0]
        expect(pad.shape).toBe("rect")
        if (pad.shape !== "rect")
          throw new Error("Expected emitted rectangular ground pad")
        expect({ x: contact.x, y: contact.y, layer: contact.layer }).toEqual({
          x: port.x,
          y: port.y,
          layer,
        })
        expect({ x: contact.x, y: contact.y }).toEqual({ x: pad.x, y: pad.y })
      }
      await expect(circuit).toMatchPcbSnapshot(
        import.meta.path.replace(".test.tsx", `-${layer}-${rotation}.test.tsx`),
      )
    }
  }
}, 20_000)
