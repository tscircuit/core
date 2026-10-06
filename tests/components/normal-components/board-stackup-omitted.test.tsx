import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("material and fabricator preset do not invent a physical stackup", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={42}
      height={22}
      material="fr4"
      fabricatorPreset="jlcpcb_standard"
      routingDisabled
    >
      <pcbnotetext
        text={
          "No physical stackup supplied\nFR4 and a tolerance preset do not supply\ndielectric spacing, Er or conductivity"
        }
        fontSize={0.8}
        anchorAlignment="center"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_board.list()[0].stackup).toBeUndefined()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
