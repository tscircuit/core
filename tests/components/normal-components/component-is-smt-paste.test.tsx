import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mounting intent overrides footprint inference without changing copper", async () => {
  const { circuit } = getTestFixture()
  const cases = [
    { name: "TH", isSmt: undefined, mixed: false, pasteCount: 0 },
    { name: "PIN_IN_PASTE", isSmt: true, mixed: false, pasteCount: 2 },
    { name: "MIXED", isSmt: undefined, mixed: true, pasteCount: 3 },
    { name: "NO_PASTE", isSmt: false, mixed: true, pasteCount: 0 },
  ]
  circuit.add(
    <board width={40} height={12} routingDisabled>
      {cases.map(({ name, isSmt, mixed }, index) => (
        <chip
          name={name}
          key={name}
          isSmt={isSmt}
          pcbX={index * 9 - 13.5}
          footprint={
            <footprint>
              <platedhole
                shape="pill"
                outerWidth={2}
                outerHeight={3}
                holeWidth={1}
                holeHeight={2}
                pcbX={-1.5}
              />
              {mixed && <smtpad shape="rect" width={1} height={2} pcbX={1.5} />}
            </footprint>
          }
        />
      ))}
      <pcbnotetext
        text="THT / explicit SMT / mixed / explicit non-SMT"
        pcbY={4}
        fontSize={0.6}
      />
    </board>,
  )
  circuit.render()
  const paste = circuit.db.pcb_solder_paste.list()
  for (const [index, { pasteCount }] of cases.entries()) {
    const centerX = index * 9 - 13.5
    expect(
      paste.filter(
        (entry) => entry.shape !== "polygon" && Math.abs(entry.x - centerX) < 3,
      ),
    ).toHaveLength(pasteCount)
  }
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(4)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  const pasteView = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        element.type === "pcb_board" ||
        element.type === "pcb_note_text" ||
        (element.type === "pcb_solder_paste" && element.layer === "top"),
    )
  await expect(pasteView).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
