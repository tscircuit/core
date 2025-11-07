import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const BOARD_SIZE = "10mm"

test("copper pour creates net from connectsTo prop", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={BOARD_SIZE} height={BOARD_SIZE}>
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const netNames = circuit.db.source_net.list().map((net) => net.name)
  expect(netNames).toContain("GND")

  const copperPours = circuit.db.pcb_copper_pour.list()
  expect(copperPours.length).toBeGreaterThan(0)
})
