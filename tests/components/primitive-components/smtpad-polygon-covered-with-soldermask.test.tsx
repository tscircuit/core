import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verify polygon smtpads respect coveredWithSolderMask prop
// and that no solder paste is generated when pad is covered

test("polygon smtpad with coveredWithSolderMask sets is_covered_with_solder_mask", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="polygon"
              points={[
                { x: -0.75, y: 0.75 },
                { x: 0.75, y: 0.75 },
                { x: 0.75, y: -0.75 },
                { x: -0.75, y: -0.75 },
              ]}
              portHints={["pin1"]}
              coveredWithSolderMask
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pad = circuit.db.pcb_smtpad.list()[0]
  expect(pad.is_covered_with_solder_mask).toBe(true)
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
