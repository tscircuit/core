import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ordinary round through-hole emits top and bottom paste without an opt-in", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} routingDisabled>
      <platedhole
        name="through_hole"
        shape="circle"
        outerDiameter={2}
        holeDiameter={1}
        pcbX={-4}
      />
      <chip
        name="U1"
        pcbX={4}
        footprint={
          <footprint>
            <smtpad shape="rect" width={2} height={2} />
          </footprint>
        }
      />
      <pcbnotetext
        text="THT: no paste requested"
        pcbX={-4}
        pcbY={3}
        fontSize={0.35}
      />
      <pcbnotetext text="SMT control" pcbX={4} pcbY={3} fontSize={0.35} />
    </board>,
  )
  circuit.render()
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(1)
  const [smtpad] = circuit.db.pcb_smtpad.list()
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(1)
  const paste = circuit.db.pcb_solder_paste.list()
  expect(paste).toHaveLength(3)
  const throughHolePaste = paste.filter(
    (entry) => entry.shape === "circle" && entry.x === -4 && entry.y === 0,
  )
  expect(throughHolePaste.map((entry) => entry.layer).sort()).toEqual([
    "bottom",
    "top",
  ])
  const smtPaste = paste.filter(
    (entry) => entry.pcb_smtpad_id === smtpad.pcb_smtpad_id,
  )
  expect(smtPaste).toHaveLength(1)
  expect(smtPaste[0].layer).toBe("top")
  // Show each paste layer alone so copper and drills cannot hide the openings.
  for (const layer of ["top", "bottom"] as const) {
    const pasteView = circuit
      .getCircuitJson()
      .filter(
        (element) =>
          element.type === "pcb_board" ||
          element.type === "pcb_note_text" ||
          (element.type === "pcb_solder_paste" && element.layer === layer),
      )
    await expect(pasteView).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${layer}.test.tsx`),
      { showSolderPaste: true },
    )
  }
})
