import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("caching a mixed footprint preserves exactly three automatic paste apertures", async () => {
  for (const cached of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={20} height={12} routingDisabled schematicDisabled>
        <subcircuit name="MIXED" _subcircuitCachingEnabled={cached}>
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
              </footprint>
            }
          />
        </subcircuit>
        <pcbnotetext
          text="Hole: top + bottom paste"
          pcbX={-3}
          pcbY={3}
          fontSize={0.45}
        />
        <pcbnotetext text="SMT: top paste" pcbX={3} pcbY={-2} fontSize={0.45} />
        <pcbnotetext
          text="3 apertures before and after caching"
          pcbY={-4}
          fontSize={0.5}
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const apertures = circuit.db.pcb_solder_paste.list()
    expect(apertures).toHaveLength(3)
    expect(apertures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          shape: "circle",
          x: -3,
          y: 0,
          radius: 1,
          layer: "top",
        }),
        expect.objectContaining({
          shape: "circle",
          x: -3,
          y: 0,
          radius: 1,
          layer: "bottom",
        }),
        expect.objectContaining({ shape: "rect", x: 3, y: 0, layer: "top" }),
      ]),
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
