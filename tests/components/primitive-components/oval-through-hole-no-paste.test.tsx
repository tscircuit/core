import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("oval through-hole preserves copper and drill while SMT paste follows its layer", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={8} routingDisabled>
      <platedhole
        shape="oval"
        outerWidth={2}
        outerHeight={3}
        holeWidth={1}
        holeHeight={2}
        pcbX={-4}
        solderMaskMargin={0.1}
      />
      <chip
        name="U1"
        pcbX={4}
        layer="bottom"
        footprint={
          <footprint>
            <smtpad shape="pill" width={2} height={1} radius={0.5} />
          </footprint>
        }
      />
      <pcbnotetext
        text="Oval: copper only / bottom SMT: paste"
        pcbY={3}
        fontSize={0.4}
      />
    </board>,
  )
  circuit.render()
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(1)
  expect(circuit.db.pcb_plated_hole.list()[0]).toMatchObject({
    shape: "oval",
    x: -4,
    y: 0,
    outer_width: 2,
    outer_height: 3,
    hole_width: 1,
    hole_height: 2,
    layers: ["top", "bottom"],
    soldermask_margin: 0.1,
  })
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(1)
  expect(circuit.db.pcb_solder_paste.list()[0]).toMatchObject({
    layer: "bottom",
    pcb_smtpad_id: circuit.db.pcb_smtpad.list()[0].pcb_smtpad_id,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
