import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an imported label with zero resolved rotation follows the flipped footprint", async () => {
  const footprint: AnyCircuitElement[] = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      layer: "top",
      shape: "rect",
      x: -1,
      y: 0,
      width: 1,
      height: 0.6,
      port_hints: ["1"],
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "label",
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.8,
      text: "U1",
      anchor_alignment: "center",
      anchor_position: { x: 0, y: 2 },
      ccw_rotation: 90,
    },
  ]
  const platform = {
    footprintLibraryMap: {
      fixture: async () => ({ footprintCircuitJson: footprint }),
    },
  }
  const { circuit } = getTestFixture({ platform })
  circuit.add(
    <board width={16} height={12} schematicDisabled routingDisabled>
      <group layer="bottom">
        <chip name="U1" footprint="fixture:label90" pcbRotation={-90} />
      </group>
      <pcbnotetext
        text="Imported U1 label: bottom, 270 degrees"
        pcbY={4}
        fontSize={0.4}
      />
    </board>,
  )

  const { circuit: explicitFlip } = getTestFixture({ platform })
  explicitFlip.add(
    <board width={16} height={12} schematicDisabled routingDisabled>
      <group>
        <chip
          name="U1"
          footprint="fixture:label90"
          pcbRotation={90}
          layer="bottom"
        />
      </group>
      <pcbnotetext
        text="Imported U1 label: bottom, 270 degrees"
        pcbY={4}
        fontSize={0.4}
      />
    </board>,
  )

  await explicitFlip.renderUntilSettled()
  await circuit.renderUntilSettled()

  await expect(explicitFlip.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path,
  )
  expect(circuit.db.pcb_silkscreen_text.list()).toEqual(
    explicitFlip.db.pcb_silkscreen_text.list(),
  )
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
