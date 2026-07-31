import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mask-covered polygon smtpad emits no solder paste", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="polygon"
              points={[
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 0, y: 1 },
              ]}
              coveredWithSolderMask
              portHints={["1"]}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_smtpad.list().length).toBe(1)
  expect(circuit.db.pcb_solder_paste.list().length).toBe(0)
})
