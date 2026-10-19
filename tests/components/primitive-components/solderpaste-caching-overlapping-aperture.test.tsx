import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("caching preserves explicit paste even when it coincides with automatic hole paste", async () => {
  for (const cached of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={20} height={12} routingDisabled schematicDisabled>
        <subcircuit name="OVERLAP" _subcircuitCachingEnabled={cached}>
          <chip
            name="U1"
            footprint={
              <footprint>
                <platedhole
                  shape="circle"
                  outerDiameter={2}
                  holeDiameter={1}
                  pcbX={-3}
                  portHints={["1"]}
                />
                <smtpad
                  shape="rect"
                  width={2}
                  height={2}
                  pcbX={3}
                  portHints={["2"]}
                />
                <solderpaste shape="circle" radius={1} pcbX={-3} layer="top" />
              </footprint>
            }
          />
        </subcircuit>
        <pcbnotetext
          text="Explicit top paste overlaps hole paste"
          pcbY={3}
          fontSize={0.5}
        />
        <pcbnotetext
          text="Keep both: 4 records before/after caching"
          pcbY={-3}
          fontSize={0.5}
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const apertures = circuit.db.pcb_solder_paste.list()
    expect(apertures).toHaveLength(4)
    const topHolePaste = apertures.filter(
      (paste) => paste.shape === "circle" && paste.layer === "top",
    )
    expect(topHolePaste).toHaveLength(2)
    const [hole] = circuit.db.pcb_plated_hole.list()
    expect(topHolePaste).toEqual([
      expect.objectContaining({ x: hole!.x, y: hole!.y, radius: 1 }),
      expect.objectContaining({ x: hole!.x, y: hole!.y, radius: 1 }),
    ])
    expect(topHolePaste).toContainEqual(
      expect.objectContaining({ pcb_component_id: hole!.pcb_component_id }),
    )
    if (cached) {
      const pasteView = circuit
        .getCircuitJson()
        .filter(
          (element) =>
            element.type === "pcb_board" ||
            element.type === "pcb_note_text" ||
            element.type === "pcb_solder_paste",
        )
      await expect(pasteView).toMatchPcbSnapshot(import.meta.path, {
        showSolderPaste: true,
      })
    }
  }
})
