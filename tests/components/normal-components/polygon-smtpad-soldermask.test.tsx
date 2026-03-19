import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Snapshot test demonstrating polygon smtpads with solder mask coverage.
 *
 * Polygon smtpads covered with solder mask are the core building block for
 * capacitive touch sensors. The solder mask acts as a dielectric, and the
 * copper polygon beneath forms the sensing electrode.
 *
 * Fixes tscircuit/tscircuit#786
 */

test("polygon smtpad with coveredWithSolderMask renders correctly", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            {/* Diamond-shaped polygon pad covered with solder mask */}
            <smtpad
              name="pad1"
              shape="polygon"
              points={[
                { x: 0, y: 2 },
                { x: 1.5, y: 0 },
                { x: 0, y: -2 },
                { x: -1.5, y: 0 },
              ]}
              portHints={["pin1"]}
              coveredWithSolderMask={true}
            />
            {/* Hexagonal polygon pad covered with solder mask */}
            <smtpad
              name="pad2"
              shape="polygon"
              points={[
                { x: 4, y: 1 },
                { x: 5, y: 0 },
                { x: 4, y: -1 },
                { x: 3, y: -1 },
                { x: 2, y: 0 },
                { x: 3, y: 1 },
              ]}
              portHints={["pin2"]}
              coveredWithSolderMask={true}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads).toHaveLength(2)

  // Both pads must be polygon shape
  for (const pad of pads) {
    expect(pad.shape).toBe("polygon")
    // is_covered_with_solder_mask must be set to true
    expect(pad.is_covered_with_solder_mask).toBe(true)
  }

  // No solder paste should be generated when pads are covered with solder mask
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(0)

  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
