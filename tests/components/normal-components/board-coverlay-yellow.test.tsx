import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("yellow flex coverlay reaches Circuit JSON and the PCB snapshot", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} material="flex" coverlayColor="yellow">
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
      <pcbnotetext
        text="yellow flex coverlay"
        pcbX={0}
        pcbY={3}
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_board.list()[0].coverlay_color).toBe("yellow")
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})
