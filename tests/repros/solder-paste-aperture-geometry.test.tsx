import { expect, test } from "bun:test"
import { pcb_solder_paste } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("stencil geometry for a rotated rectangle, saved oval and rectangular SMT pad", async () => {
  const { circuit } = getTestFixture()
  const oval = pcb_solder_paste.parse({
    type: "pcb_solder_paste",
    pcb_solder_paste_id: "oval",
    shape: "oval",
    layer: "top",
    width: 4,
    height: 1.5,
    x: 0,
    y: 0,
  })
  circuit.add(
    <board width={23} height={8} routingDisabled schematicDisabled>
      <pcbnotetext text="Top stencil openings" pcbY={2.8} fontSize={0.75} />
      <solderpaste
        shape="rect"
        width={4}
        height={1}
        pcbX={-7}
        pcbRotation={35}
      />
      <subcircuit name="Imported" circuitJson={[oval]} />
      <chip
        name="U1"
        pcbX={7}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={4}
              height={2}
              portHints={["1"]}
              solderPasteMargin={0}
              solderPasteMarginRatio={{ x: -0.1, y: -0.25 }}
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="Rectangle at 35 deg"
        pcbX={-7}
        pcbY={-2.5}
        fontSize={0.45}
      />
      <pcbnotetext text="4 x 1.5 mm oval" pcbY={-2.5} fontSize={0.45} />
      <pcbnotetext
        text="3.2 x 1 mm paste"
        pcbX={7}
        pcbY={-2.5}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const openings = circuit.db.pcb_solder_paste.list()
  expect(openings.find((p) => p.shape === "rotated_rect")).toMatchObject({
    shape: "rotated_rect",
    ccw_rotation: expect.closeTo(35),
    width: 4,
    height: 1,
  })
  expect(openings.find((p) => p.shape === "oval")).toMatchObject({
    width: 4,
    height: 1.5,
  })
  expect(openings.find((p) => p.pcb_smtpad_id)).toMatchObject({
    width: 3.2,
    height: 1,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
