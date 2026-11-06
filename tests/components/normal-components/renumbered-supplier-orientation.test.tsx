import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement, PcbSmtPadRect } from "circuit-json"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const contacts = [
  { label: "A1B12", x: -2, y: 1 },
  { label: "A4B9", x: 0, y: 1 },
  { label: "B4A9", x: 1, y: 1 },
  { label: "EH1", x: -1, y: -2 },
] as const

const supplierPads = contacts.map(
  ({ label, x, y }, index): PcbSmtPadRect => ({
    type: "pcb_smtpad",
    pcb_smtpad_id: `pcb_smtpad_${index}`,
    shape: "rect",
    x,
    y,
    width: 0.5,
    height: 0.5,
    layer: "top",
    port_hints: [`pin${index + 1}`, label],
  }),
)

test("Core emits a supplier rotation for renumbered contacts in their authored footprint frame", async () => {
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C165948"] }),
    fetchPartCircuitJson: () => supplierPads as AnyCircuitElement[],
  }
  const { circuit } = getTestFixture({ platform: { partsEngine } })
  circuit.add(
    <board width={26} height={12}>
      {[
        { name: "J1", x: -8, offset: 0, rotation: 180, moved: false },
        { name: "J2", x: 0, offset: 90, rotation: 270, moved: false },
        { name: "J3", x: 8, offset: 0, rotation: 90, moved: true },
      ].map(({ name, x: pcbX, offset, rotation, moved }) => (
        <chip
          key={name}
          name={name}
          pcbX={pcbX}
          pcbRotation={rotation}
          pinLabels={Object.fromEntries(
            contacts.map(({ label }, index) => [`pin${index + 17}`, label]),
          )}
          supplierPartNumbers={{ jlcpcb: ["C165948"] }}
          footprint={
            <footprint>
              {contacts.map(({ label, x, y }, index) => (
                <Fragment key={label}>
                  <smtpad
                    shape="rect"
                    pcbX={offset === 90 ? -y : x}
                    pcbY={
                      (offset === 90 ? x : y) + (moved && index === 3 ? 0.2 : 0)
                    }
                    width={0.5}
                    height={0.5}
                    portHints={[`pin${index + 17}`]}
                  />
                </Fragment>
              ))}
            </footprint>
          }
        />
      ))}
      <pcbnotetext text="J1 offset 0°" pcbX={-8} pcbY={-4} />
      <pcbnotetext text="J2 offset 90°" pcbX={0} pcbY={-4} />
      <pcbnotetext text="J3 moved pad" pcbX={8} pcbY={-4} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const [j1, j2, j3] = circuit.db.pcb_component.list()
  expect(j1?.pin1_location).toBeUndefined()
  expect(j1?.supplier_rotation_offset_map).toEqual({ jlcpcb: 0 })
  expect(j2?.supplier_rotation_offset_map).toEqual({ jlcpcb: 90 })
  expect(j3?.supplier_rotation_offset_map).toBeUndefined()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
