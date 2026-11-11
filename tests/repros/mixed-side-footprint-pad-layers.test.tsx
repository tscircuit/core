import { beforeAll, expect, test } from "bun:test"
import type { SmtPad } from "lib/components/primitive-components/SmtPad"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

beforeAll(async () => {
  const footprint = (
    <footprint>
      <smtpad
        shape="rect"
        width={1.2}
        height={1.2}
        layer="top"
        pcbX={-1.5}
        portHints={["pin1"]}
      />
      <smtpad
        shape="rect"
        width={1.2}
        height={1.2}
        layer="bottom"
        pcbX={1.5}
        portHints={["pin2"]}
      />
      <pcbnotetext
        text="pin1"
        pcbX={-1.5}
        pcbY={-1.2}
        fontSize={0.45}
        color="white"
      />
      <pcbnotetext
        text="pin2"
        pcbX={1.5}
        pcbY={-1.2}
        fontSize={0.45}
        color="white"
      />
    </footprint>
  )

  circuit.add(
    <board width={20} height={8} routingDisabled schematicDisabled>
      <pcbnotetext
        text="Authored footprint: pin1 TOP, pin2 BOTTOM"
        pcbY={3}
        fontSize={0.5}
        color="white"
      />
      <pcbnotetext
        text="U1: layer=top"
        pcbX={-4.5}
        pcbY={1.5}
        fontSize={0.45}
        color="white"
      />
      <chip name="U1" layer="top" isSmt pcbX={-4.5} footprint={footprint} />
      <pcbnotetext
        text="U2: layer=bottom (flipped)"
        pcbX={4.5}
        pcbY={1.5}
        fontSize={0.45}
        color="white"
      />
      <chip name="U2" layer="bottom" isSmt pcbX={4.5} footprint={footprint} />
      <pcbnotetext
        text="TOP copper = red; BOTTOM copper = blue"
        pcbY={-3}
        fontSize={0.45}
        color="white"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Show both copper layers together so a layer change only changes pad color.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing(
  "mixed-side footprints preserve pad, port, and paste layers",
  () => {
    for (const [name, layers] of [
      ["U1", ["top", "bottom"]],
      ["U2", ["bottom", "top"]],
    ] as const) {
      for (const [pinIndex, layer] of layers.entries()) {
        const smtpad = circuit.selectOne(
          `.${name} smtpad.pin${pinIndex + 1}`,
        ) as SmtPad
        const pad = circuit.db.pcb_smtpad.get(smtpad.pcb_smtpad_id!)!
        expect(pad.layer).toBe(layer)
        expect(smtpad.getAvailablePcbLayers()).toEqual([layer])
        expect(circuit.db.pcb_port.get(pad.pcb_port_id!)!.layers).toEqual([
          layer,
        ])
        expect(
          circuit.db.pcb_solder_paste
            .list()
            .filter((paste) => paste.pcb_smtpad_id === pad.pcb_smtpad_id)
            .map((paste) => paste.layer),
        ).toEqual([layer])
      }
    }
  },
)
