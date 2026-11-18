import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("paste keeps direct rotation, imported ovals and per-axis margins", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={9} routingDisabled schematicDisabled>
      <solderpaste
        shape="rect"
        width={4}
        height={1}
        pcbX={-7}
        {...{ pcbRotation: 35 }}
      />
      <subcircuit
        name="OVAL"
        circuitJson={[
          {
            type: "pcb_solder_paste",
            pcb_solder_paste_id: "imported_oval",
            shape: "oval",
            layer: "top",
            x: 0,
            y: 0,
            width: 4,
            height: 1.5,
          },
        ]}
      />
      <chip name="PAD" pcbX={7}>
        <footprint>
          <smtpad
            shape="rect"
            width={4}
            height={2}
            portHints={["1"]}
            solderPasteMargin={0}
            {...{ solderPasteMarginRatio: { x: -0.1, y: -0.25 } }}
          />
        </footprint>
      </chip>
      <pcbnotetext
        text="Direct rotation: 35 deg"
        pcbX={-7}
        pcbY={-3}
        fontSize={0.4}
      />
      <pcbnotetext text="Imported oval: 4 x 1.5 mm" pcbY={-3} fontSize={0.4} />
      <pcbnotetext text="Paste: 3.2 x 1 mm" pcbX={7} pcbY={-3} fontSize={0.4} />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
  expect(circuit.db.pcb_solder_paste.list()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        shape: "rotated_rect",
        width: 4,
        height: 1,
        ccw_rotation: 35,
      }),
      expect.objectContaining({ shape: "oval", width: 4, height: 1.5 }),
      expect.objectContaining({ shape: "rect", width: 3.2, height: 1 }),
    ]),
  )
})
