import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbDisabled skips independent paste apertures", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board width={10} height={10}>
      <solderpaste shape="rect" width={2} height={1} />
      <solderpaste shape="circle" radius={0.5} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(0)
})
