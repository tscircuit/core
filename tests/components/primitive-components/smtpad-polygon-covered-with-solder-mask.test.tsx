import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbSmtPadPolygon } from "circuit-json"

test("polygon smtpads support coveredWithSolderMask", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm">
      <chip
        name="U1"
        layer="top"
        footprint={
          <footprint>
            <smtpad
              shape="polygon"
              pcbX={-4}
              points={[
                { x: -1.2, y: 0.8 },
                { x: -0.3, y: 1.1 },
                { x: 1.1, y: 0.4 },
                { x: 0.8, y: -0.9 },
                { x: -0.7, y: -1.1 },
              ]}
              portHints={["1"]}
              coveredWithSolderMask={true}
            />
            <smtpad
              shape="polygon"
              pcbX={4}
              points={[
                { x: -1.2, y: 0.8 },
                { x: -0.3, y: 1.1 },
                { x: 1.1, y: 0.4 },
                { x: 0.8, y: -0.9 },
                { x: -0.7, y: -1.1 },
              ]}
              portHints={["2"]}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pads = circuit.db.pcb_smtpad
    .list()
    .filter((pad): pad is PcbSmtPadPolygon => pad.shape === "polygon")

  expect(pads).toHaveLength(2)
  expect(pads[0].is_covered_with_solder_mask).toBe(true)
  expect(pads[1].is_covered_with_solder_mask).toBe(false)

  const solderPasteForPads = circuit.db.pcb_solder_paste
    .list()
    .filter((paste) =>
      pads.some((pad) => pad.pcb_smtpad_id === paste.pcb_smtpad_id),
    )

  expect(solderPasteForPads).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})
