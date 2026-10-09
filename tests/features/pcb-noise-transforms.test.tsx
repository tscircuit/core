import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NoiseBoard } from "tests/fixtures/pcb-noise-board"

test("noise contacts match emitted rotated and bottom-side pads", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <NoiseBoard layer={layer} rotation={rotation} connections={false} />,
      )
      await circuit.renderUntilSettled()
      const [configuration] =
        circuit.db.simulation_pcb_noise_configuration.list()
      for (const port of configuration.ports) {
        for (const contact of [port.signal_contact, port.reference_contact]) {
          if (contact.contact_type !== "pcb_port")
            throw new Error("Expected a physical PCB pad")
          const pcbPort = circuit.db.pcb_port.get(contact.pcb_port_id)!
          const pad =
            circuit.db.pcb_smtpad.list({
              pcb_port_id: pcbPort.pcb_port_id,
            })[0] ??
            circuit.db.pcb_plated_hole.list({
              pcb_port_id: pcbPort.pcb_port_id,
            })[0]
          if (pad.shape !== "rect" && pad.shape !== "circle") {
            throw new Error(
              "Fixture uses rectangular pads and circular plated holes",
            )
          }
          expect({ x: contact.x, y: contact.y, layer: contact.layer }).toEqual({
            x: pcbPort.x,
            y: pcbPort.y,
            layer,
          })
          expect({ x: contact.x, y: contact.y }).toEqual({ x: pad.x, y: pad.y })
        }
      }
      await expect(circuit).toMatchPcbSnapshot(
        import.meta.path.replace(".test.tsx", `-${layer}-${rotation}.test.tsx`),
      )
    }
  }
}, 60_000)
